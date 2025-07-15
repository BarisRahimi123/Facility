'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
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

      // Get the full user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile by ID:', userError);
        
        // Try fetching by email if ID fails
        const { data: userByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .limit(1)
          .maybeSingle();
          
        if (!emailError && userByEmail) {
          console.log('Found user by email instead of ID');
          setUser(userByEmail);
        } else {
          // Still set basic user info from auth
          console.log('Using basic auth info as fallback');
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || '',
            role: authUser.user_metadata?.role || 'staff',
            is_active: true,
            created_at: authUser.created_at || new Date().toISOString(),
          });
        }
      } else {
        console.log('AuthContext: User profile loaded:', userData.email, userData.role);
        setUser(userData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading user:', error);
      setError(error instanceof Error ? error.message : 'Failed to load user');
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const checkInitialSession = async () => {
      console.log('AuthContext: Checking initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (session) {
        console.log('AuthContext: Session found, refreshing user...');
        await refreshUser();
      } else {
        console.log('AuthContext: No session found');
        setLoading(false);
      }
    };

    checkInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        await refreshUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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