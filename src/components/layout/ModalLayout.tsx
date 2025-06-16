'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalLayoutProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
  actions?: ReactNode;
}

export default function ModalLayout({
  children,
  title,
  onClose,
  actions,
}: ModalLayoutProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0E0E0]">
          <h2 className="text-lg font-semibold text-[#333333]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Actions */}
        {actions && (
          <div className="px-6 py-4 border-t border-[#E0E0E0] flex items-center justify-end space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
} 