'use client';

import React, { useState, useCallback, memo, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Configure PDF.js worker
// Use a local worker instead of CDN for better performance
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  
  // Fallback to CDN if local worker is not available
  fetch('/pdf.worker.min.js')
    .then(response => {
      if (!response.ok) {
        console.warn('Local PDF worker not found, using CDN fallback');
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      }
    })
    .catch(() => {
      console.warn('Local PDF worker not found, using CDN fallback');
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    });
}

interface PDFViewerProps {
  url: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
  scale?: number;
}

// Memoize the component to prevent unnecessary re-renders
const PDFViewer = memo(({ 
  url, 
  onLoadSuccess, 
  onLoadError,
  scale: initialScale = 1.0 
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reset state when URL changes
  useEffect(() => {
    setPageNumber(1);
    setIsLoading(true);
  }, [url]);

  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    if (onLoadSuccess) onLoadSuccess();
  }, [onLoadSuccess]);

  const handleDocumentLoadError = useCallback((error: Error) => {
    setIsLoading(false);
    if (onLoadError) onLoadError(error);
    console.error('Error loading PDF:', error);
  }, [onLoadError]);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.25, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPrevPage} 
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-gray-50">
        <Document
          file={url}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Failed to load PDF</p>
            </div>
          }
        >
          {!isLoading && (
            <Page
              key={`page_${pageNumber}_scale_${scale}`}
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="flex items-center justify-center h-[600px] w-[400px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
            />
          )}
        </Document>
      </div>
    </div>
  );
});

// Add display name for debugging
PDFViewer.displayName = 'PDFViewer';

export default PDFViewer; 