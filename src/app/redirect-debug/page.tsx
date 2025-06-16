'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientBrowser } from '@/lib/supabase-browser';

export default function RedirectDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Move all client-side logic inside this effect
  useEffect(() => {
    // First set mounted to true to indicate client-side rendering has begun
    setMounted(true);
    
    // Only run client-side code after mounting
    if (typeof window !== 'undefined') {
      const initialLogMessage = 'Component mounted';
      console.log(initialLogMessage);
      
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      const formattedLog = `[${timestamp}] ${initialLogMessage}`;
      setLogs([formattedLog]);
      
      // Check if router is available
      if (router) {
        const routerLog = 'Next.js router is available';
        console.log(routerLog);
        setLogs(prev => [`[${timestamp}] ${routerLog}`, ...prev]);
      } else {
        const routerWarning = 'WARNING: Next.js router is not available';
        console.warn(routerWarning);
        setLogs(prev => [`[${timestamp}] ${routerWarning}`, ...prev]);
      }
      
      // Check if window is available
      const windowLog = `Window location: ${window.location.href}`;
      console.log(windowLog);
      setLogs(prev => [`[${timestamp}] ${windowLog}`, ...prev]);
    }
  }, [router]);

  const addLog = (message: string) => {
    if (!mounted) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [logMessage, ...prev]);
  };

  const testSignInRedirect = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      addLog('Testing sign-in and redirect to dashboard...');
      
      const supabase = createClientBrowser();
      addLog('Supabase client created');
      
      // Check if already signed in
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        addLog(`Already signed in as ${sessionData.session.user.email}`);
        addLog('Attempting redirect to dashboard...');
        
        // Try router first
        try {
          addLog('Using Next.js router.push("/dashboard")');
          router.push('/dashboard');
          addLog('Router.push called - check if page changes');
        } catch (routerError) {
          addLog(`Router error: ${routerError instanceof Error ? routerError.message : String(routerError)}`);
          
          // Fallback to window.location
          addLog('Falling back to window.location.href redirect');
          window.location.href = '/dashboard';
        }
      } else {
        addLog('No active session found, attempting sign in first');
        
        // Test credentials - replace with test account
        const testEmail = 'test@example.com';
        const testPassword = 'password123';
        
        addLog(`Attempting to sign in with ${testEmail}`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (error) {
          addLog(`Sign in error: ${error.message}`);
          throw error;
        }
        
        if (data?.user) {
          addLog(`Successfully signed in as ${data.user.email}`);
          addLog('Waiting 1 second before redirect...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          addLog('Redirecting to dashboard...');
          window.location.href = '/dashboard';
        } else {
          addLog('No user data returned after sign in');
        }
      }
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testManualRedirect = () => {
    if (!mounted) return;
    
    try {
      addLog('Testing manual redirect to dashboard...');
      addLog('Using window.location.href = "/dashboard"');
      window.location.href = '/dashboard';
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Return a skeleton UI with the same structure for server-side rendering
  // This ensures hydration doesn't encounter mismatches
  if (!mounted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Redirect Debug Page</h1>
        <p className="mb-6 text-gray-600">
          This page helps debug redirection issues between sign-in and dashboard.
        </p>
        
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            disabled={true}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Sign In & Redirect
          </button>
          
          <button
            disabled={true}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Manual Redirect
          </button>
          
          <Link href="/dashboard" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block">
            Go to Dashboard
          </Link>
          
          <Link href="/auth/sign-in-simple" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block">
            Go to Sign In
          </Link>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            <div className="text-gray-500">Loading logs...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Redirect Debug Page</h1>
      <p className="mb-6 text-gray-600">
        This page helps debug redirection issues between sign-in and dashboard.
      </p>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={testSignInRedirect}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Sign In & Redirect'}
        </button>
        
        <button
          onClick={testManualRedirect}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Manual Redirect
        </button>
        
        <Link href="/dashboard" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block">
          Go to Dashboard
        </Link>
        
        <Link href="/auth/sign-in-simple" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 inline-block">
          Go to Sign In
        </Link>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No logs yet. Click a test button to begin.</div>
          )}
        </div>
      </div>
    </div>
  );
} 