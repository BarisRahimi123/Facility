'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Maximize2, 
  Minimize2, 
  FileText, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface SimplePDFViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  height?: number;
  showHeader?: boolean;
}

export default function SimplePDFViewer({
  fileUrl,
  fileName = 'Document',
  className = '',
  height = 600,
  showHeader = true
}: SimplePDFViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

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
      window.open(fileUrl, '_blank');
    }
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Create the PDF viewer URL with embedded parameters
  const pdfViewerUrl = `${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`;

  return (
    <Card className={`bg-gray-900 border-gray-700 ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className}`}>
      {showHeader && (
        <CardHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-purple-400" />
              {fileName}
              <Badge variant="outline" className="text-gray-300 border-gray-600">
                PDF Viewer
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
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-red-400 bg-gray-950 p-8">
              <AlertCircle className="h-12 w-12" />
              <div className="text-center max-w-lg">
                <p className="font-medium">PDF Preview Not Available</p>
                <p className="text-sm text-gray-500 mt-1">
                  This browser doesn't support PDF preview or the file is corrupted.
                </p>
                
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
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
          ) : (
            <iframe
              src={pdfViewerUrl}
              className="w-full h-full border-0"
              title={fileName}
              onError={() => setHasError(true)}
              onLoad={(e) => {
                // Check if iframe loaded successfully
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  if (!iframe.contentDocument && !iframe.contentWindow) {
                    setHasError(true);
                  }
                } catch (err) {
                  // Cross-origin restrictions - this is normal
                  console.log('PDF loaded in iframe (cross-origin)');
                }
              }}
              style={{
                background: '#1f2937'
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 