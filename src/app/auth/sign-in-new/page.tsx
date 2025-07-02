'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Import the correct Supabase client
import { createClient } from '@/lib/supabase/client';

export default function NewSignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // User is already logged in, redirect to dashboard
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Session check error:', err);
      }
    };
    
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('Form submission started for:', email);
      
      // Validate inputs
      if (!email) {
        throw new Error('Email is required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!password) {
        throw new Error('Password is required');
      }
      
      // Create a fresh Supabase client for this request
      const supabase = createClient();
      
      // Direct Supabase auth call
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (authError) {
        throw authError;
      }
      
      if (data?.user) {
        console.log('Sign in successful:', data.user.email);
        
        // Add a small delay to ensure the session is properly set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to dashboard instead of home page
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || "An error occurred during sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-gray-600 mt-2">
            New version with direct Supabase auth
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          
          <div className="text-sm text-right">
            <Link href="/auth/reset-password" className="text-blue-600 hover:text-blue-800">
              Forgot your password?
            </Link>
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </p>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <Link href="/auth/sign-in-simple" className="text-sm text-blue-600 hover:underline">
              Try Simple Version
            </Link>
            <Link href="/auth-debug" className="text-sm text-blue-600 hover:underline">
              Debug Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 