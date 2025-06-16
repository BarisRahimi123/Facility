'use client';

import { X } from 'lucide-react';
import MaintenanceForm from './MaintenanceForm';
import type { MaintenanceFormData } from './MaintenanceForm';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MaintenanceFormData) => void;
  initialData?: Partial<MaintenanceFormData>;
}

export default function MaintenanceModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: MaintenanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Maintenance Schedule' : 'Schedule New Maintenance'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <MaintenanceForm
            onSubmit={onSubmit}
            onCancel={onClose}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
} 