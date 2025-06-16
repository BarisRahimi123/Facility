'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TestAuthRoutePage() {
  const [testResult, setTestResult] = useState<string | null>(null);
  
  const testAuthRoutes = async () => {
    setTestResult('Testing auth routes...');
    
    try {
      // Test auth/sign-in route
      const authSignInRes = await fetch('/auth/sign-in', { method: 'HEAD' });
      const authSignUpRes = await fetch('/auth/sign-up', { method: 'HEAD' });
      
      setTestResult(`
        Auth routes test results:
        - /auth/sign-in: ${authSignInRes.ok ? 'OK' : 'Failed'} (${authSignInRes.status})
        - /auth/sign-up: ${authSignUpRes.ok ? 'OK' : 'Failed'} (${authSignUpRes.status})
      `);
    } catch (error) {
      setTestResult(`Error testing routes: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-6">Auth Routes Test Page</h1>
      
      <div className="space-y-4 w-full max-w-md">
        <Button onClick={testAuthRoutes} className="w-full">
          Test Auth Routes
        </Button>
        
        <div className="mt-4 space-y-2">
          <h2 className="text-lg font-semibold">Manual Test Links:</h2>
          <div className="flex flex-col space-y-2">
            <Link href="/auth/sign-in" className="text-blue-600 hover:underline">
              Go to /auth/sign-in
            </Link>
            <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
              Go to /auth/sign-up
            </Link>
          </div>
        </div>
        
        {testResult && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 