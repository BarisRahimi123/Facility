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
    
    // Force Supabase to check fresh session state
    const resetAuth = async () => {
      const supabase = createClient();
      
      // First, try to sign out any existing session to prevent stuck state
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.log('No session to sign out');
      }
      
      // Then check if somehow still logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      // If already logged in, redirect immediately
      if (session?.user) {
        window.location.replace('/facilities-map');
      }
    };
    
    resetAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Full reload ensures cookies are applied and contexts rehydrate properly
        await new Promise(resolve => setTimeout(resolve, 150));
        window.location.replace('/facilities-map');
        return;
      }

    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message?.includes('Auth session missing')) {
        setError('Authentication session error. Please try again.');
      } else {
        setError(error.message || 'Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar />
      
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
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Signing in...' : 'Sign in'}
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