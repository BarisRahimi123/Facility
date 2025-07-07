'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { GlassNavbar } from '@/components/ui/glass-navbar';
import { NoSSR } from '@/components/ui/no-ssr';
import { AuthLoadingSkeleton } from '@/components/ui/auth-loading-skeleton';
import { createClient } from '@/lib/supabase/client';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign in attempt started...'); // Debug log
    setLoading(true);

    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
      console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const supabase = createClient();
      console.log('Supabase client created');
      
      // Authenticate with Supabase
      console.log('Attempting sign in with email:', email.trim());
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('Sign in response received');
      console.log('Auth data:', data);
      console.log('Auth error:', error);

      if (error) {
        console.error('Authentication error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('No user returned from authentication');
        throw new Error('Authentication failed - no user returned');
      }

      console.log('User authenticated:', data.user.email);

      // Wait a moment for session to be established
      console.log('Waiting for session to establish...');
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: 'Success',
        description: 'Welcome back!',
      });

      // Check user role and redirect appropriately
      try {
        console.log('Fetching user profile...');
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('email', data.user.email)
          .single();

        console.log('Profile data:', userProfile);
        console.log('Profile error:', profileError);

        const userRole = userProfile?.role;
        console.log('User role:', userRole);
        
        // Use window.location.href for full page reload to ensure auth state is picked up
        let redirectUrl = '/facilities-map'; // default
        
        if (userRole === 'master_admin' || userRole === 'district_approver') {
          redirectUrl = '/people';
        } else if (userRole === 'sub_master' || userRole === 'site_approver') {
          redirectUrl = '/facilities';
        } else if (userRole === 'staff' || userRole === 'manager' || userRole === 'coordinator') {
          redirectUrl = '/staff';
        } else if (userRole === 'renter') {
          redirectUrl = '/facilities-map';
        }
        
        console.log('Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
        
      } catch (roleError) {
        console.error('Error determining user role:', roleError);
        // Default fallback - redirect to facilities map
        console.log('Using fallback redirect to /facilities-map');
        window.location.href = '/facilities-map';
      }

    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'An error occurred during sign in';
      
      if (error.message?.includes('Invalid login credentials')) {
        // Check if this might be an unverified email issue
        errorMessage = 'Invalid email or password. If you just signed up, please check your email and verify your account first.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the verification link to complete your registration.';
        // Redirect to verification page with email
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else if (error.message?.includes('signup')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox for a verification link.';
        // Redirect to verification page with email
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many sign in attempts. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      console.log('Sign in process completed, setting loading to false');
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
              {/* Debug link */}
              <p className="mt-2 text-xs text-muted-foreground">
                Having issues? <Link href="/auth/debug" className="text-primary hover:underline">Check debug info</Link>
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
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
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
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/auth/reset-password"
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Sign in
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link
                  href="/auth/sign-up"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
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