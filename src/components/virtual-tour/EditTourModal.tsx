'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface EditTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tourData: {
    name: string;
    modelId: string;
    description: string;
  }) => void;
  tour?: {
    name: string;
    modelId: string;
    description: string;
  };
}

export default function EditTourModal({
  isOpen,
  onClose,
  onSave,
  tour,
}: EditTourModalProps) {
  const [formData, setFormData] = useState({
    name: tour?.name || '',
    modelId: tour?.modelId || '',
    description: tour?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#333333]">
            {tour ? 'Edit Virtual Tour' : 'Add New Virtual Tour'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tour Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
              placeholder="Enter tour name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matterport Model ID or URL
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) => {
                let modelId = e.target.value;
                // Extract model ID if full URL is pasted
                if (modelId.includes('matterport.com')) {
                  const match = modelId.match(/[?&]m=([^&]+)/);
                  if (match) modelId = match[1];
                }
                setFormData((prev) => ({ ...prev, modelId }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
              placeholder="Enter Matterport model ID or URL"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              You can enter either the model ID or paste the full Matterport URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] h-32 resize-none"
              placeholder="Enter tour description"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
            >
              {tour ? 'Save Changes' : 'Add Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 