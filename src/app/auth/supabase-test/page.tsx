'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientBrowser } from '@/lib/supabase-browser';

// Test component to verify Supabase connection
export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [connectionDetails, setConnectionDetails] = useState<string>('Testing connection...');
  const [authStatus, setAuthStatus] = useState<string>('Checking auth status...');
  const [testEmail, setTestEmail] = useState<string>('');
  const [testPassword, setTestPassword] = useState<string>('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [envVariables, setEnvVariables] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    setMounted(true);
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setEnvVariables({
      'NEXT_PUBLIC_SUPABASE_URL': !!supabaseUrl,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!supabaseAnonKey
    });
    
    // Only run client-side code when mounted
    if (typeof window !== 'undefined') {
      testSupabaseConnection();
      checkAuthStatus();
    }
  }, []);

  // Test the Supabase connection
  const testSupabaseConnection = async () => {
    try {
      setConnectionStatus('loading');
      setConnectionDetails('Initializing Supabase client...');
      
      const startTime = Date.now();
      const supabase = createClientBrowser();
      
      setConnectionDetails('Testing database connection...');
      
      // Try a simple query to test the connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .maybeSingle();
        
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        throw error;
      }
      
      setConnectionStatus('success');
      setConnectionDetails(`Connection successful! Response time: ${duration}ms`);
      
    } catch (err) {
      setConnectionStatus('error');
      setConnectionDetails(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Supabase connection test failed:', err);
    }
  };

  // Check the current authentication status
  const checkAuthStatus = async () => {
    try {
      const supabase = createClientBrowser();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        setAuthStatus(`Logged in as: ${data.session.user.email || 'Unknown email'}`);
      } else {
        setAuthStatus('Not logged in');
      }
    } catch (err) {
      setAuthStatus(`Auth check error: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Auth status check failed:', err);
    }
  };

  // Test sign in with provided credentials
  const testSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testEmail || !testPassword) {
      setTestResult('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setTestResult('Attempting to sign in...');
      
      const supabase = createClientBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        setTestResult(`Sign in successful! User: ${data.user.email}`);
        checkAuthStatus(); // Refresh auth status
      } else {
        setTestResult('Sign in appeared successful, but no user data returned');
      }
    } catch (err) {
      setTestResult(`Sign in failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Test sign in failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out test
  const testSignOut = async () => {
    try {
      setIsLoading(true);
      setTestResult('Attempting to sign out...');
      
      const supabase = createClientBrowser();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setTestResult('Sign out successful!');
      checkAuthStatus(); // Refresh auth status
    } catch (err) {
      setTestResult(`Sign out failed: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Test sign out failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If not mounted yet, show loading state
  if (!mounted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <p className="mb-6 text-gray-600">Loading test utilities...</p>
        
        <div className="flex justify-center">
          <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <p className="mb-6 text-gray-600">
        This page tests your Supabase connection and authentication functionality.
      </p>
      
      {/* Environment Variables Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <ul className="space-y-2">
          {Object.entries(envVariables).map(([key, value]) => (
            <li key={key} className="flex items-center">
              <span className={`inline-block w-4 h-4 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="font-mono">{key}: </span>
              <span className={`ml-2 ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value ? 'Configured' : 'Missing'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Connection Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="flex items-center mb-4">
          <span className={`inline-block w-4 h-4 rounded-full mr-2 ${
            connectionStatus === 'success' ? 'bg-green-500' : 
            connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
          }`}></span>
          <span className="font-medium">
            {connectionStatus === 'success' ? 'Connected' : 
             connectionStatus === 'error' ? 'Connection Failed' : 'Connecting...'}
          </span>
        </div>
        <p className="text-gray-600 text-sm">
          {connectionDetails}
        </p>
        <button 
          onClick={testSupabaseConnection}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Connection Again
        </button>
      </div>
      
      {/* Authentication Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
        <p className="mb-4 font-medium">{authStatus}</p>
        <button 
          onClick={checkAuthStatus}
          className="mr-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Auth Status
        </button>
        <button 
          onClick={testSignOut}
          disabled={isLoading || authStatus === 'Not logged in'}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Test Sign Out
        </button>
      </div>
      
      {/* Test Sign In */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Sign In</h2>
        <form onSubmit={testSignIn} className="space-y-4">
          <div>
            <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="testPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="testPassword"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {testResult && (
            <div className={`text-sm p-2 rounded ${
              testResult.includes('successful') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Sign In"}
          </button>
        </form>
      </div>
      
      {/* Navigation Links */}
      <div className="flex flex-wrap gap-4">
        <Link href="/auth/sign-in-simple" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block">
          Go to Sign In
        </Link>
        
        <Link href="/dashboard" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block">
          Go to Dashboard
        </Link>
        
        <Link href="/console-debug" className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 inline-block">
          Go to Console Debug
        </Link>
      </div>
    </div>
  );
} 