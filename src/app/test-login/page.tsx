'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const [email, setEmail] = useState('85baris@gmail.com');
  const [password, setPassword] = useState('Eb745365');
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setStatus('Logging in...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }

      if (data?.user) {
        setStatus('Success! Redirecting to dashboard...');
        
        // Try different navigation methods
        setTimeout(() => {
          // Method 1: Using router.push
          router.push('/dashboard');
          
          // Method 2: If that doesn't work, try window.location
          setTimeout(() => {
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
            }
          }, 1000);
        }, 500);
      }
    } catch (err) {
      setStatus(`Unexpected error: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Test Login</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Login
          </button>
          
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p className="text-sm">Status: {status || 'Ready'}</p>
          </div>
          
          <div className="mt-4 space-y-2">
            <a href="/dashboard" className="block text-blue-500 hover:underline">
              Direct link to /dashboard
            </a>
            <a href="/(app)/dashboard" className="block text-blue-500 hover:underline">
              Direct link to /(app)/dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 