'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/user';
import { clearAuthCache, getCachedUser, cacheUser } from '@/utils/authCache';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start with null to ensure server and client have same initial state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const refreshUser = async (retryCount = 0) => {
    try {
      console.log('AuthContext: Refreshing user...');
      setError(null);
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('AuthContext: Auth error:', authError);
        if (authError.message.includes('Auth session missing') && retryCount < 3) {
          console.log(`Auth session missing, retrying... (${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 500ms to 100ms
          return refreshUser(retryCount + 1);
        }
        throw authError;
      }
      
      if (!authUser) {
        console.log('AuthContext: No auth user found');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('AuthContext: Auth user found:', authUser.email);

      // Get the full user profile with timeout to prevent hanging
      let userData = null;
      let userError = null;
      
      try {
        // Add timeout to prevent hanging in production
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout after 5s')), 5000)
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        userData = result?.data;
        userError = result?.error;
      } catch (timeoutError) {
        console.error('Database query timed out or failed:', timeoutError);
        userError = timeoutError;
      }

      if (userError) {
        console.error('Error fetching user profile by ID:', userError);
        
        // Try fetching by email if ID fails (with timeout)
        try {
          const emailQueryPromise = supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .limit(1)
            .maybeSingle();
          
          const emailTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email query timeout after 5s')), 5000)
          );
          
          const emailResult = await Promise.race([emailQueryPromise, emailTimeoutPromise]) as any;
          const userByEmail = emailResult?.data;
          const emailError = emailResult?.error;
          
          if (!emailError && userByEmail) {
            console.log('Found user by email instead of ID');
            setUser(userByEmail);
            // Cache user data
            cacheUser(userByEmail);
          } else {
            // Still set basic user info from auth
            console.log('Using basic auth info as fallback');
            const basicUser = {
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || '',
              role: authUser.email === '85baris@gmail.com' ? 'master_admin' : (authUser.user_metadata?.role || 'staff'),
              is_active: true,
              created_at: authUser.created_at || new Date().toISOString(),
            };
            setUser(basicUser);
            // Cache basic user data
            cacheUser(basicUser);
          }
        } catch (emailTimeoutError) {
          console.error('Email query also timed out, using auth data only:', emailTimeoutError);
          // Use basic auth info as ultimate fallback
          const basicUser = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || '',
            role: authUser.email === '85baris@gmail.com' ? 'master_admin' : (authUser.user_metadata?.role || 'staff'),
            is_active: true,
            created_at: authUser.created_at || new Date().toISOString(),
          };
          setUser(basicUser);
          cacheUser(basicUser);
        }
      } else {
        console.log('AuthContext: User profile loaded:', userData.email, userData.role);
        setUser(userData);
        // Cache user data for faster initial load
        cacheUser(userData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user');
      setUser(null);
      // Clear cached user on error
      clearAuthCache();
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load cached user after hydration to prevent mismatch
    if (typeof window !== 'undefined' && !hydrated) {
      const cachedUser = getCachedUser();
      if (cachedUser) {
        console.log('AuthContext: Loaded cached user:', cachedUser.email);
        setUser(cachedUser);
        // Don't set loading to false here - wait for session check
      }
      setHydrated(true);
    }
  }, [hydrated]);

  useEffect(() => {
    let mounted = true;
    
    const checkInitialSession = async () => {
      if (sessionChecked) return; // Prevent duplicate checks
      
      try {
        console.log('AuthContext: Checking initial session...');
        
        // Use real session check with better error handling and shorter timeouts
        console.log('🔍 AuthContext: Checking real session with 3s timeout...');
        
        // Try session check with 8s timeout and fallback to cached user
        let session = null;
        try {
          const sessionPromise = supabase.auth.getSession();
          const sessionTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 8000)
          );
          
          const sessionResult = await Promise.race([sessionPromise, sessionTimeoutPromise]) as any;
          session = sessionResult?.data?.session;
          console.log('✅ AuthContext: Session check completed');
        } catch (timeoutError) {
          console.warn('⚠️ AuthContext: Session check timed out, using cached user');
          
          // Use cached user if available instead of kicking user out
          const cachedUser = getCachedUser();
          if (cachedUser) {
            console.log('🔧 AuthContext: Using cached user:', cachedUser.email);
            setUser(cachedUser);
            setSessionChecked(true);
            setLoading(false);
            return;
          }
          
          // If no cached user, redirect to sign-in
          console.log('❌ AuthContext: No cached user, redirecting to sign-in');
          throw timeoutError;
        }
        
        if (!mounted) return;
        
        setSessionChecked(true);
        
        if (session) {
          console.log('AuthContext: Session found');
          // Only refresh if we don't have cached user or if cached user ID doesn't match
          const cachedUser = getCachedUser();
          
          if (!cachedUser || cachedUser.id !== session.user.id) {
            console.log('AuthContext: Refreshing user data (cache miss or mismatch)');
            
            // Add timeout to refreshUser call - this is the critical fix
            const refreshPromise = refreshUser();
            const refreshTimeoutPromise = new Promise((resolve) => 
              setTimeout(() => {
                console.error('RefreshUser timed out after 8s, using fallback');
                // Create fallback user for master admin
                if (session.user.email === '85baris@gmail.com') {
                  const fallbackUser = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || 'Master Admin',
                    role: 'master_admin',
                    is_active: true,
                    created_at: session.user.created_at || new Date().toISOString(),
                  };
                  setUser(fallbackUser);
                  cacheUser(fallbackUser);
                }
                setLoading(false); // CRITICAL: Always set loading to false
                resolve(null);
              }, 8000)
            );
            
            await Promise.race([refreshPromise, refreshTimeoutPromise]);
          } else {
            console.log('AuthContext: Using cached user (cache hit)');
            setLoading(false);
          }
        } else {
          console.log('AuthContext: No session found');
          setUser(null);
          clearAuthCache();
          setLoading(false);
        }

      } catch (error) {
        console.error('AuthContext: Session check failed:', error);
        
        // Emergency fallback for master admin
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email === '85baris@gmail.com') {
            console.log('Emergency fallback for master admin');
            const emergencyUser = {
              id: session.user.id,
              email: session.user.email,
              full_name: 'Master Admin',
              role: 'master_admin',
              is_active: true,
              created_at: session.user.created_at || new Date().toISOString(),
            };
            setUser(emergencyUser);
            cacheUser(emergencyUser);
          } else {
            setUser(null);
          }
        } catch (emergencyError) {
          console.error('Emergency fallback failed:', emergencyError);
          setUser(null);
        }
        
        setLoading(false); // ALWAYS set loading to false
      }
    };

    // Only check session after hydration
    if (hydrated && !sessionChecked) {
      checkInitialSession();
    }

    // Listen for auth changes with better error handling
    console.log('🔍 AuthContext: Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event);
      
      // Skip initial session event to avoid duplicate checks
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        setSessionChecked(true);
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        // Clear state and cache immediately to avoid stuck loading/icon states
        clearAuthCache();
        setUser(null);
        setSessionChecked(false);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Only refresh if necessary
        if (user && user.id === session.user.id) {
          console.log('Token refreshed but user unchanged, skipping refresh');
        } else {
          await refreshUser();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrated, sessionChecked, user]);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshUser }}>
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