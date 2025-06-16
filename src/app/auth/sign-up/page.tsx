'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Logo } from '@/components/ui/logo';
import { ArrowLeft } from 'lucide-react';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    setMounted(true);
    
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Session check error:', error.message);
          setDebugInfo(`Supabase initialization issue: ${error.message}`);
          return;
        }
        
        if (data.session) {
          // User is already logged in, redirect to dashboard
          console.log('User already logged in, redirecting to dashboard...');
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Session check error:', err);
        setDebugInfo(`Failed to check session: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    checkSession();
  }, [router]);

  // Reset errors when inputs change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError('');
    if (confirmPassword && e.target.value !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (e.target.value !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Email validation with more detailed checks
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else {
      // Comprehensive email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address (e.g., user@example.com)');
        isValid = false;
      }
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      isValid = false;
    } else if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setDebugInfo('Processing sign-up...');

    try {
      // Trim whitespace from email to prevent accidental spaces
      const trimmedEmail = email.trim().toLowerCase();
      
      // Create a fresh Supabase client for this request
      const supabase = createClient();
      
      setDebugInfo('Sending sign-up request to Supabase...');
      
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        setDebugInfo(`Sign-up error: ${error.message}`);
        
        if (error.message.includes('already registered')) {
          toast({
            title: 'Sign up failed',
            description: 'This email is already registered. Please try signing in instead.',
            variant: 'destructive',
          });
        } else {
          console.error('Signup error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          throw error;
        }
        return;
      }

      if (data?.user) {
        setDebugInfo('Sign-up successful! Verification email sent.');
        
        toast({
          title: 'Success',
          description: 'Please check your email to confirm your account. Check your spam folder if you don\'t see it.',
          variant: 'success',
        });
        
        // Add a small delay before redirecting
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/auth/sign-in-simple');
      } else {
        setDebugInfo('Sign-up response received but no user data returned');
        throw new Error('No user data returned from sign-up');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setDebugInfo(`Sign-up exception: ${error instanceof Error ? error.message : String(error)}`);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred during sign up',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show a simple loading state before client-side code runs
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Back to Home Link */}
      <div className="p-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-center text-3xl font-bold">FacilityCore</h2>
              <span className="px-2 py-1 bg-purple-600/20 rounded-full text-xs font-medium text-purple-400">
                BETA
              </span>
            </div>
            <h3 className="mt-2 text-center text-xl text-gray-300">
              Create your account
            </h3>
            <p className="mt-2 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/auth/sign-in-simple" 
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 bg-gray-800/30 rounded-2xl p-8 backdrop-blur-xl border border-gray-700/50">
            <form className="space-y-6" onSubmit={handleSignUp}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-200">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={handleEmailChange}
                    className={`bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 ${
                      emailError ? 'border-red-500' : 'focus:border-purple-500'
                    }`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-400">
                      {emailError}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    className={`bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 ${
                      passwordError ? 'border-red-500' : 'focus:border-purple-500'
                    }`}
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-400">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 ${
                      confirmPasswordError ? 'border-red-500' : 'focus:border-purple-500'
                    }`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  {confirmPasswordError && (
                    <p className="mt-1 text-sm text-red-400">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>
              </div>

              {debugInfo && process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-400 p-2 bg-gray-900/30 rounded border border-gray-700/50">
                  Debug: {debugInfo}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-2 px-4 rounded-full transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 