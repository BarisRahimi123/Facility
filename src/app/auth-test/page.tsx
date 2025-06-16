'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AuthTestPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking session:', error);
        setMessage(`Session error: ${error.message}`);
        return;
      }

      if (session) {
        setUser(session.user);
        setMessage('User is authenticated');
      } else {
        setUser(null);
        setMessage('No active session');
      }
    } catch (error) {
      console.error('Error in checkSession:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // First try direct Supabase sign-in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Supabase sign-in failed, trying test endpoint:', error);
        
        // If direct sign-in fails, try the test endpoint
        const response = await fetch('/api/auth/test-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to sign in');
        }

        setMessage('Signed in via test endpoint');
        setUser(result.user);
        
        // Refresh the session
        await checkSession();
      } else {
        setMessage('Signed in via Supabase');
        setUser(data.user);
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMessage('Signed out successfully');
    } catch (error) {
      console.error('Sign-out error:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToDashboard = () => {
    router.push('/dashboard');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Authentication Test</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Status:</h2>
          <p className={`${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {message || 'No status'}
          </p>
        </div>

        {user ? (
          <div className="mb-6">
            <h2 className="font-semibold mb-2">User Info:</h2>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
              <pre className="text-xs">{JSON.stringify(user, null, 2)}</pre>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Sign Out'}
              </button>
              
              <button
                onClick={handleRedirectToDashboard}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/auth/sign-in-simple" className="text-blue-500 hover:text-blue-700">
            Go to Sign In Page
          </Link>
        </div>
      </div>
    </div>
  );
} 