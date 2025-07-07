'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function PeopleErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('People page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
          <CardDescription>
            An error occurred while loading the People page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-mono text-muted-foreground">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>
          
          {error.stack && (
            <details className="cursor-pointer">
              <summary className="text-sm text-muted-foreground hover:text-foreground">
                Show error details
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.href = '/facilities'}>
              Go to Facilities
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 