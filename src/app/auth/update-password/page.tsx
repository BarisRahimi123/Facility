'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    
    // Check if we have a code in the URL (from password reset email)
    const code = searchParams?.get('code');
    if (!code) {
      setError('Invalid or missing reset code. Please request a new password reset link.');
    } else {
      setDebugInfo('Reset code found in URL');
    }
  }, [searchParams]);

  const validatePassword = () => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Reset states
    setError(null);
    setMessage(null);
    
    // Validate password
    if (!validatePassword()) {
      return;
    }
    
    setIsLoading(true);
    setDebugInfo('Processing password update...');
    
    try {
      const supabase = createClient();
      
      // Get the code from the URL
      const code = searchParams?.get('code');
      if (!code) {
        throw new Error('Missing reset code');
      }
      
      setDebugInfo('Updating password...');
      
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password.trim()
      });
      
      if (error) {
        setDebugInfo(`Password update error: ${error.message}`);
        throw error;
      }
      
      setDebugInfo('Password updated successfully');
      setMessage('Your password has been updated successfully. You can now sign in with your new password.');
      
      // Add a delay before redirecting
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 3000);
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show a simple loading state before client-side code runs
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Update Password</h1>
          <p className="text-gray-600 mt-2">
            Create a new password for your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters with one uppercase letter and one number
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          
          {message && (
            <div className="text-sm text-green-500 p-2 bg-green-50 rounded">
              {message}
            </div>
          )}
          
          {debugInfo && (
            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border border-gray-200">
              Debug: {debugInfo}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading || !searchParams?.get('code')}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <Link href="/auth" className="text-sm text-blue-600 hover:underline">
              Back to Auth Options
            </Link>
            <Link href="/auth/supabase-test" className="text-sm text-blue-600 hover:underline">
              Test Connection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}  