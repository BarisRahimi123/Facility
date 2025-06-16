'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function FacilitiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Facilities page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-semibold text-red-700">Error Loading Facilities</h2>
        </div>
        
        <p className="text-gray-700 mb-4">
          We encountered an issue while loading the facilities data. This could be due to a network issue or a problem with the database.
        </p>
        
        <div className="bg-white p-4 rounded border border-red-100 font-mono text-sm overflow-auto max-h-[200px] mb-4">
          {error.message}
        </div>
        
        <div className="flex space-x-4">
          <Button 
            onClick={() => reset()}
            variant="primary"
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
} 