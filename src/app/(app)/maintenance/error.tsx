'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MaintenanceError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Maintenance page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Error loading maintenance</h1>
        <p className="text-gray-600 mb-6">
          We're sorry, but there was an error loading the maintenance page. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              Go to dashboard
            </Link>
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-md text-left">
            <p className="text-sm font-medium text-gray-900 mb-2">Error details (only visible in development):</p>
            <p className="text-sm text-gray-700 break-words">{error.message}</p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 