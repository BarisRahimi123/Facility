'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Loader2,
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

// Declare global types for PDF.js Express
declare global {
  interface Window {
    PDFJSExpress: any;
  }
}

interface PDFExpressViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  height?: number;
  showHeader?: boolean;
}

export default function PDFExpressViewer({
  fileUrl,
  fileName = 'Document',
  className = '',
  height = 600,
  showHeader = true
}: PDFExpressViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [instance, setInstance] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const loadPDFJSExpress = () => {
      return new Promise((resolve, reject) => {
        if (window.PDFJSExpress) {
          setDebugInfo('PDF.js Express already loaded');
          resolve(window.PDFJSExpress);
          return;
        }

        setDebugInfo('Loading PDF.js Express from CDN...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@pdftron/pdfjs-express@10.11.0/public/pdfjs-express-viewer.min.js';
        script.onload = () => {
          if (window.PDFJSExpress) {
            setDebugInfo('PDF.js Express loaded successfully');
            resolve(window.PDFJSExpress);
          } else {
            setDebugInfo('PDF.js Express script loaded but window.PDFJSExpress not found');
            reject(new Error('PDF.js Express failed to load'));
          }
        };
        script.onerror = (err) => {
          setDebugInfo('Failed to load PDF.js Express script from CDN');
          reject(new Error('Failed to load PDF.js Express script'));
        };
        document.head.appendChild(script);
      });
    };

    const initViewer = async () => {
      if (!viewerRef.current) {
        setDebugInfo('Viewer ref not available');
        return;
      }

      try {
        setDebugInfo('Initializing PDF viewer...');
        const PDFJSExpress = await loadPDFJSExpress() as any;

        setDebugInfo(`Loading document: ${fileUrl}`);
        
        const viewerInstance = await PDFJSExpress.WebViewer({
          licenseKey: 'zQiN646asboBVwbyI7Qw',
          path: 'https://cdn.jsdelivr.net/npm/@pdftron/pdfjs-express@10.11.0/public/',
          initialDoc: fileUrl,
          enableFilePicker: false,
          fullAPI: false,
          enableRedaction: false,
          enableMeasurement: false,
          enableAnnotations: false,
        }, viewerRef.current);

        if (!mounted) return;

        setInstance(viewerInstance);
        setDebugInfo('PDF viewer initialized successfully');

        // Configure the viewer
        viewerInstance.UI.addEventListener('documentLoaded', () => {
          if (mounted) {
            setIsLoading(false);
            setError(null);
            setDebugInfo('Document loaded successfully');
          }
        });

        viewerInstance.UI.addEventListener('documentLoadedError', (err: any) => {
          if (mounted) {
            const errorMsg = `Document loading error: ${err?.message || 'Unknown error'}`;
            setError(errorMsg);
            setDebugInfo(errorMsg);
            setIsLoading(false);
            console.error('PDF loading error:', err);
          }
        });

        // Set a timeout for loading
        setTimeout(() => {
          if (mounted && isLoading) {
            setError('PDF loading timeout - document may be too large or corrupted');
            setIsLoading(false);
          }
        }, 30000); // 30 second timeout

        // Customize the UI after a short delay
        setTimeout(() => {
          try {
            viewerInstance.UI.setTheme('dark');
            
            // Hide unnecessary elements
            viewerInstance.UI.disableElements([
              'ribbons',
              'toggleNotesButton',
              'searchButton',
              'menuButton',
              'rubberStampToolGroupButton',
              'stampToolGroupButton',
              'fileAttachmentToolGroupButton',
              'calloutToolGroupButton',
              'stitchToolGroupButton',
              'signatureToolGroupButton',
              'freeTextToolGroupButton',
              'textSelectButton',
              'panToolButton'
            ]);

            // Enable useful features
            viewerInstance.UI.enableElements([
              'downloadButton',
              'printButton',
              'zoomInButton',
              'zoomOutButton',
              'fitButton',
              'rotateClockwiseButton',
              'rotateCounterClockwiseButton'
            ]);
          } catch (uiError) {
            console.warn('UI customization error:', uiError);
          }
        }, 1000);

      } catch (err: any) {
        console.error('Error initializing PDF.js Express:', err);
        if (mounted) {
          const errorMsg = `Failed to initialize PDF viewer: ${err?.message || 'Unknown error'}`;
          setError(errorMsg);
          setDebugInfo(errorMsg);
          setIsLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      mounted = false;
      if (instance) {
        try {
          instance.UI.dispose();
        } catch (err) {
          console.error('Error disposing PDF viewer:', err);
        }
      }
    };
  }, [fileUrl]);

  const downloadPDF = () => {
    try {
      const link = window.document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const retryLoad = () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo('Retrying...');
    
    // Force reload by updating the key
    if (instance) {
      try {
        instance.UI.dispose();
      } catch (err) {
        console.error('Error disposing instance:', err);
      }
      setInstance(null);
    }
    
    // Trigger re-initialization
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Card className={`bg-gray-900 border-gray-700 ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {showHeader && (
        <CardHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-purple-400" />
              {fileName}
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                PDF.js Express
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                title="Open in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={`p-0 ${isFullscreen ? 'h-full' : ''}`}>
        <div 
          className="relative bg-gray-950"
          style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-400 bg-gray-950">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading PDF.js Express viewer...</p>
              {debugInfo && (
                <p className="text-xs text-gray-500 text-center max-w-md">{debugInfo}</p>
              )}
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-400 bg-gray-950 p-8">
              <AlertCircle className="h-12 w-12" />
              <div className="text-center max-w-lg">
                <p className="font-medium">Failed to load PDF</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
                
                {debugInfo && (
                  <div className="mt-3 p-3 bg-gray-800 rounded text-xs text-gray-400 text-left">
                    <p className="font-medium text-gray-300 mb-1">Debug Info:</p>
                    <p>{debugInfo}</p>
                    <p className="mt-1">File URL: {fileUrl}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryLoad}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInNewTab}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div 
            ref={viewerRef} 
            className="w-full h-full"
            style={{ 
              display: isLoading || error ? 'none' : 'block',
              height: '100%'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
} 