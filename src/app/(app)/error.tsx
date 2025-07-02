'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error
    console.error('App error:', error);

    // Check if it's a Safari-specific auth error
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari && error.message?.includes('auth')) {
      // Clear any corrupted auth data
      try {
        localStorage.removeItem('sb-session');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('sb-access-token');
        sessionStorage.clear();
      } catch {
        // Ignore errors
      }
    }
  }, [error]);

  const handleRetry = () => {
    // For Safari, do a full page reload
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      window.location.reload();
    } else {
      reset();
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Something went wrong!
          </h1>
          
          <p className="text-gray-400 mb-6">
            An unexpected error has occurred. Please try again later.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Try Again
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Return Home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                Error details
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 p-2 bg-gray-800 rounded">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
} 