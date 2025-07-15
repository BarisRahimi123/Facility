'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  File,
  AlertCircle
} from 'lucide-react';
import PDFExpressViewer from './PDFExpressViewer';
import SimplePDFViewer from './SimplePDFViewer';

interface DocumentFile {
  id: string;
  name: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  uploaded_at: string;
  version?: string;
  tags?: string[];
}

interface DocumentModalProps {
  document: DocumentFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentModal({ document, isOpen, onClose }: DocumentModalProps) {
  const [imageError, setImageError] = useState(false);
  const [useFallbackPDF, setUseFallbackPDF] = useState(true); // Default to simple viewer

  if (!document) return null;

  const isPDF = document.file_type.toLowerCase() === 'application/pdf' || 
                document.name.toLowerCase().endsWith('.pdf');
  
  const isImage = document.file_type.startsWith('image/') || 
                  /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(document.name);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadDocument = () => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const openInNewTab = () => {
    window.open(document.file_url, '_blank');
  };

  const getFileIcon = () => {
    if (isPDF) return <FileText className="h-5 w-5 text-red-400" />;
    if (isImage) return <ImageIcon className="h-5 w-5 text-blue-400" />;
    return <File className="h-5 w-5 text-gray-400" />;
  };

  const renderDocumentContent = () => {
    if (isPDF) {
      if (useFallbackPDF) {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
              <p className="text-sm text-gray-300">Simple PDF Viewer</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseFallbackPDF(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Try PDF.js Express
              </Button>
            </div>
            <SimplePDFViewer
              fileUrl={document.file_url}
              fileName={document.name}
              height={600}
              showHeader={false}
            />
          </div>
        );
      }
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
            <p className="text-sm text-gray-300">PDF.js Express Viewer</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseFallbackPDF(true)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Simple Viewer
            </Button>
          </div>
          <PDFExpressViewer
            fileUrl={document.file_url}
            fileName={document.name}
            height={600}
            showHeader={false}
          />
        </div>
      );
    }

    if (isImage && !imageError) {
      return (
        <div className="flex justify-center items-center bg-gray-950 rounded-lg" style={{ height: 600 }}>
          <img
            src={document.file_url}
            alt={document.name}
            onError={() => setImageError(true)}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    // Fallback for other file types or image errors
    return (
      <div className="flex flex-col items-center justify-center bg-gray-950 rounded-lg p-8" style={{ height: 600 }}>
        <div className="flex flex-col items-center gap-4 text-center">
          {imageError ? (
            <AlertCircle className="h-16 w-16 text-red-400" />
          ) : (
            getFileIcon()
          )}
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              {imageError ? 'Failed to load image' : 'Preview not available'}
            </h3>
            <p className="text-gray-400 mb-4">
              {imageError 
                ? 'The image could not be displayed. You can still download the file.'
                : 'This file type cannot be previewed in the browser. You can download it to view.'
              }
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadDocument}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={openInNewTab}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gray-900 border-gray-700 p-0">
        <DialogHeader className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 text-white text-lg">
                {getFileIcon()}
                {document.name}
                {document.version && (
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    v{document.version}
                  </Badge>
                )}
              </DialogTitle>
              
              <div className="mt-2 space-y-2">
                {document.description && (
                  <p className="text-sm text-gray-400">{document.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Uploaded {formatDate(document.uploaded_at)}</span>
                  {document.file_size && (
                    <span>{formatFileSize(document.file_size)}</span>
                  )}
                  <span className="capitalize">{document.file_type}</span>
                </div>
                
                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {document.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-purple-600/20 text-purple-400 border-purple-600/50"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocument}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          {renderDocumentContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}  