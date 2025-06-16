'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

// Mock user for development
const mockUser: User = {
  id: 'mock-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
};

// Mock session for development
const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: mockUser,
  token_type: 'bearer'
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  authError: Error | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData?: { firstName?: string; lastName?: string }) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUser);
  const [session, setSession] = useState<Session | null>(mockSession);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Memoized version of initializeAuth to avoid dependency issues
  const initializeAuth = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isLoading) {
      console.log('Auth initialization already in progress, skipping...');
      return () => {};
    }
    try {
      console.log('Starting authentication initialization...');
      setIsLoading(true);
      setAuthError(null);
      
      // First try a quick check to see if we're already authenticated
      // This uses the helper from supabase.ts that has a short timeout
      let triedLocalRecovery = false;
      
      try {
        const { data: cachedSession } = await supabase.auth.getSession();
        if (cachedSession.session) {
          console.log('Found cached session, using it');
          setSession(cachedSession.session);
          setUser(cachedSession.session.user);
          setIsLoading(false);
          
          // Set up auth change listener and return
          return setupAuthListener();
        }
      } catch (cachedError) {
        console.warn('Error getting cached session:', cachedError);
        // Continue with the normal flow
      }
      
      // Create a timeout promise
      const timeoutPromise = new Promise<{data: {session: null}, error: Error}>((_, reject) => {
        setTimeout(() => {
          const timeoutError = new Error('Authentication timeout');
          console.warn('Authentication timeout reached');
          reject(timeoutError);
        }, 15000); // 15 seconds timeout
      });
      
      // Race between the actual auth request and the timeout
      let authResult;
      try {
        authResult = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]).catch(err => {
          console.error('Auth initialization failed:', err);
          // Ensure isLoading is set to false on error
          setIsLoading(false);
          return { data: { session: null }, error: err };
        });
      } catch (raceError) {
        console.error('Error in Promise.race:', raceError);
        authResult = { data: { session: null }, error: raceError as Error };
      }
      
      const { data: { session }, error } = authResult;
      
      if (error) {
        console.error('Error getting session:', error);
        setAuthError(error);
        
        // Try recovery strategies
        if (!triedLocalRecovery) {
          triedLocalRecovery = true;
          
          // Try refreshing the session
          try {
            console.log('Attempting to refresh session...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Session refresh failed:', refreshError);
            } else if (refreshData.session) {
              console.log('Session refreshed successfully');
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              setIsLoading(false);
              
              return setupAuthListener();
            }
          } catch (refreshError) {
            console.error('Error refreshing session:', refreshError);
          }
          
          // Try localStorage if refresh failed
          try {
            console.log('Attempting localStorage recovery...');
            if (typeof window !== 'undefined') {
              // Check for auth data in localStorage
              const localSession = localStorage.getItem('supabase.auth.token');
              if (localSession) {
                console.log('Found local auth data, attempting to recover...');
                
                // Force a session refresh
                const { data: recoveryData, error: recoveryError } = await supabase.auth.refreshSession();
                
                if (recoveryError) {
                  console.error('Recovery failed:', recoveryError);
                } else if (recoveryData.session) {
                  console.log('Session recovered successfully');
                  setSession(recoveryData.session);
                  setUser(recoveryData.session.user);
                  setIsLoading(false);
                  
                  return setupAuthListener();
                }
              }
            }
          } catch (recoveryError) {
            console.error('LocalStorage recovery failed:', recoveryError);
          }
        }
        
        // If all recovery attempts failed
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return () => {};
      }

      console.log('Session check complete:', session ? 'Session found' : 'No session');
      
      if (session) {
        setSession(session);
        setUser(session.user);
        console.log('User authenticated:', session.user.email);
      } else {
        setSession(null);
        setUser(null);
        console.log('No user authenticated');
      }

      // Set up auth change listener
      return setupAuthListener();
    } catch (error) {
      console.error('Unexpected error in initializeAuth:', error);
      setAuthError(error instanceof Error ? error : new Error('Unknown authentication error'));
      toast({
        title: 'Authentication Error',
        description: 'Failed to initialize authentication.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return () => {};
    }
  }, [router, toast]);

  // Extract the auth listener setup for reuse
  const setupAuthListener = useCallback(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, newSession: Session | null) => {
        console.log('Auth state change:', event);
        
        // Only update state if it actually changed
        if (newSession?.user?.id !== user?.id) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
        }
        
        // Only handle specific events to prevent loops
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Don't auto-redirect, let the user navigate manually
        } else if (event === 'SIGNED_IN' && newSession) {
          console.log('User signed in');
          // Don't auto-redirect, let the sign-in page handle it
        }
      }
    );

    console.log('Auth listener setup complete');
    setIsLoading(false);
    return () => {
      console.log('Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // Initialize auth state - DISABLED for now to prevent issues
  useEffect(() => {
    console.log('Auth provider mounted - using mock auth only');
    setIsInitialized(true);
    setIsLoading(false);
    // Don't initialize real auth to prevent redirect loops
  }, []);

  // Mock sign in
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(mockUser);
      setSession(mockSession);
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      return { user: mockUser, session: mockSession };
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock sign up
  const signUp = async (
    email: string,
    password: string,
    userData?: { firstName?: string; lastName?: string }
  ) => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(mockUser);
      setSession(mockSession);
      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
      return { user: mockUser, session: mockSession };
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      setSession(null);
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock reset password
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for password reset instructions.',
      });
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Mock update password
  const updatePassword = async (password: string) => {
    setIsLoading(true);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
      });
    } catch (error) {
      setAuthError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    authError,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  // Traditional Context.Provider syntax (React 19 simplified syntax not stable yet)
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 