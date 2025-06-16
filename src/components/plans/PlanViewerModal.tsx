'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Document, Page, pdfjs } from 'react-pdf';
import type { Plan } from '@/app/actions/plans';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PlanViewerModalProps {
  plan: Plan;
  onClose: () => void;
}

export default function PlanViewerModal({ plan, onClose }: PlanViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{plan.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {plan.url && (
            <Document
              file={plan.url}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex justify-center"
            >
              <Page 
                pageNumber={currentPage} 
                renderTextLayer={false}
                className="max-w-full"
              />
            </Document>
          )}
        </div>

        {numPages > 1 && (
          <div className="flex justify-center items-center gap-4 p-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
              disabled={currentPage >= numPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 