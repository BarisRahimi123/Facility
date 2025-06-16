'use client';

import { useState } from 'react';
import ModalLayout from '../layout/ModalLayout';

interface AddFolderModalProps {
  onClose: () => void;
  onAdd: (folder: { name: string; description?: string }) => void;
}

export default function AddFolderModal({ onClose, onAdd }: AddFolderModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onAdd({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });
    onClose();
  };

  return (
    <ModalLayout
      title="Create New Folder"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[#E0E0E0] rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-folder-form"
            disabled={!formData.name.trim()}
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Folder
          </button>
        </>
      }
    >
      <form id="add-folder-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8]"
            placeholder="Enter folder name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8] h-32 resize-none"
            placeholder="Enter folder description"
          />
        </div>
      </form>
    </ModalLayout>
  );
} 