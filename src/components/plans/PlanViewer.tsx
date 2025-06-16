'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PDFViewer from './PDFViewer';
import type { Plan } from '@/app/actions/plans';

// Define props interface
interface PlanViewerProps {
  plan: Plan;
  onClose: () => void;
}

// Memoize the component to prevent unnecessary re-renders
const PlanViewer = memo(({ plan, onClose }: PlanViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use callbacks for event handlers to prevent unnecessary re-renders
  const handleLoadSuccess = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleLoadError = useCallback((error: Error) => {
    setIsLoading(false);
    setError(`Failed to load PDF: ${error.message}`);
    console.error('PDF load error:', error);
  }, []);

  // Reset loading state when plan changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [plan.id]);

  // Get the PDF URL from the plan
  const pdfUrl = plan.url || `/api/plans/${plan.id}/download`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">{plan.name || 'Untitled Plan'}</h2>
            <p className="text-sm text-gray-500">
              {plan.sheet_number && `Sheet ${plan.sheet_number}`}
              {plan.revision && ` • Rev ${plan.revision}`}
              {plan.scale && ` • Scale: ${plan.scale}`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center p-6 max-w-md">
                <div className="text-red-500 text-xl mb-4">Error</div>
                <p className="text-gray-700">{error}</p>
                <Button className="mt-4" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}
          
          <PDFViewer 
            url={pdfUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
          />
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
PlanViewer.displayName = 'PlanViewer';

export default PlanViewer; 