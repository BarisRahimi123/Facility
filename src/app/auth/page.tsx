'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [redirectFailed, setRedirectFailed] = useState(false);
  
  useEffect(() => {
    // Client-side redirect to the sign-in page
    try {
      console.log('Redirecting to sign-in page...');
      
      // Use a timeout to ensure the redirect happens
      const redirectTimeout = setTimeout(() => {
        router.replace('/auth/sign-in');
      }, 100);
      
      // Set a fallback in case the redirect doesn't work
      const fallbackTimeout = setTimeout(() => {
        setRedirectFailed(true);
      }, 3000);
      
      return () => {
        clearTimeout(redirectTimeout);
        clearTimeout(fallbackTimeout);
      };
    } catch (error) {
      console.error('Redirect error:', error);
      setRedirectFailed(true);
    }
  }, [router]);
  
  if (redirectFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-xl font-semibold mb-4">Redirect Failed</h1>
          <p className="text-gray-600 mb-6">
            We couldn't automatically redirect you to the sign-in page.
            Please click the button below to continue.
          </p>
          <Link 
            href="/auth/sign-in"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Sign In
          </Link>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link href="/auth-debug" className="text-sm text-blue-600 hover:underline">
              Go to Debug Page
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-600 mb-4">
          Please wait while we redirect you to the sign-in page.
        </p>
        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
} 