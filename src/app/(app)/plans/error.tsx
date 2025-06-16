'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PlansError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Plans page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">Error loading plans</h1>
        <p className="text-gray-400 mb-6">
          We're sorry, but there was an error loading the plans page. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700 text-white">
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
              Go to dashboard
            </Button>
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-md text-left">
            <p className="text-sm font-medium text-gray-300 mb-2">Error details (only visible in development):</p>
            <p className="text-sm text-gray-400 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 