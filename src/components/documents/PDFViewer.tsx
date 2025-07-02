'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Loader2
} from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  height?: number;
  showControls?: boolean;
  showHeader?: boolean;
}

export default function PDFViewer({
  fileUrl,
  fileName = 'Document',
  className = '',
  height = 600,
  showControls = true,
  showHeader = true
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF loading error:', error);
    setError('Failed to load PDF document');
    setIsLoading(false);
  }, []);

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(newPageNumber, numPages));
    });
  };

  const changeScale = (scaleDelta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + scaleDelta;
      return Math.max(0.5, Math.min(newScale, 3.0));
    });
  };

  const rotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setPageNumber(1);
  };

  return (
    <Card className={`bg-gray-900 border-gray-700 ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {showHeader && (
        <CardHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-purple-400" />
              {fileName}
              {numPages > 0 && (
                <Badge variant="outline" className="text-gray-300 border-gray-600">
                  {numPages} page{numPages !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={`p-0 ${isFullscreen ? 'h-full' : ''}`}>
        {showControls && (
          <div className="flex items-center justify-between p-4 bg-gray-800/50 border-b border-gray-700">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1 || isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span>Page</span>
                <input
                  type="number"
                  min={1}
                  max={numPages}
                  value={pageNumber}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= numPages) {
                      setPageNumber(page);
                    }
                  }}
                  className="w-12 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center text-white"
                />
                <span>of {numPages}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages || isLoading}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom and Rotation Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeScale(-0.2)}
                disabled={scale <= 0.5}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-300 min-w-[4rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeScale(0.2)}
                disabled={scale >= 3.0}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={rotate}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs px-2"
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* PDF Display Area */}
        <div 
          className="flex justify-center items-center bg-gray-950 overflow-auto"
          style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
        >
          {isLoading && (
            <div className="flex flex-col items-center gap-4 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading PDF...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 text-red-400">
              <FileText className="h-12 w-12" />
              <div className="text-center">
                <p className="font-medium">Failed to load PDF</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="pdf-container">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex flex-col items-center gap-4 text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading PDF...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center gap-4 text-red-400">
                    <FileText className="h-12 w-12" />
                    <p>Failed to load PDF document</p>
                  </div>
                }
                className="shadow-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  loading={
                    <div className="flex items-center justify-center h-96 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading page...
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-96 text-red-400">
                      <p>Failed to load page</p>
                    </div>
                  }
                  className="border border-gray-600 shadow-lg"
                />
              </Document>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 