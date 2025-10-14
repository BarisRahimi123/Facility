'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassNavbar } from '@/components/ui/glass-navbar';
import { createClient } from '@/lib/supabase/client';
import { NoSSR } from '@/components/ui/no-ssr';
import { AuthLoadingSkeleton } from '@/components/ui/auth-loading-skeleton';
import { clearAuthCache } from '@/utils/authCache';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Clear any stale auth state on sign-in page mount
  useEffect(() => {
    // Clear all auth caches to prevent stuck sessions
    clearAuthCache();
    
    // Check if already logged in and redirect (non-blocking)
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        
        // Don't block page render, check auth in background
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            console.log('User already signed in, redirecting...');
            window.location.replace('/facilities-map');
          }
        }).catch(error => {
          console.log('Background auth check failed (non-fatal):', error);
        });
      } catch (error) {
        console.log('Auth check setup failed (non-fatal):', error);
      }
    };
    
    // Run auth check after a small delay to let page render first
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      console.log('Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('Sign in response:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasSession: !!data?.session,
        error: error?.message 
      });

      if (error) {
        console.error('Supabase auth error:', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        throw error;
      }

      if (data.user) {
        console.log('Sign in successful, redirecting...');
        // Show success state briefly before redirect
        setError('');
        
        // Small delay for UX feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use router.push first for faster navigation, with window.location as fallback
        try {
          router.push('/facilities-map');
          // Also do full reload as backup to ensure auth state is fresh
          setTimeout(() => {
            window.location.href = '/facilities-map';
          }, 1000);
        } catch (navError) {
          // Fallback to window.location if router fails
          window.location.href = '/facilities-map';
        }
        
        // Keep loading true during redirect
        return;
      }

    } catch (error: any) {
      console.error('Sign in error:', error);
      setLoading(false); // Stop loading on error
      
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else if (error.message?.includes('Auth session missing')) {
        setError('Authentication session error. Please try again.');
      } else {
        setError(error.message || 'Sign in failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar />
      
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-lg p-6 shadow-lg flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            <p className="text-foreground font-medium">Signing you in...</p>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      )}
      
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-muted/20" />
        
        <div className="relative w-full max-w-md space-y-8">
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your account to continue
              </p>

            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full relative"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/auth/sign-up" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <NoSSR fallback={<AuthLoadingSkeleton />}>
      <SignInForm />
    </NoSSR>
  );
}  