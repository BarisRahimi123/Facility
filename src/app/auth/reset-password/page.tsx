'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientBrowser } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Reset states
    setError(null);
    setMessage(null);
    setDebugInfo(null);
    
    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setDebugInfo('Processing password reset request...');
    
    try {
      const supabase = createClientBrowser();
      
      setDebugInfo('Sending password reset email...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        setDebugInfo(`Password reset error: ${error.message}`);
        throw error;
      }
      
      setDebugInfo('Password reset email sent successfully');
      setMessage('Check your email for a password reset link. If you don\'t see it, check your spam folder.');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send password reset email');
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
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-gray-600 mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
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
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link href="/auth/sign-in-simple" className="text-blue-600 hover:text-blue-800">
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