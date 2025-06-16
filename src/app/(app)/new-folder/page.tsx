'use client';

import { useState } from 'react';
import { Folder, ChevronRight } from 'lucide-react';

export default function NewFolderPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // TODO: Implement folder creation logic
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-8">
          <span>Files</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-[#1a73e8] font-medium">New Folder</span>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-6">
          <div className="flex items-center mb-6">
            <Folder className="w-6 h-6 text-[#1a73e8] mr-3" />
            <h1 className="text-xl font-medium">Create New Folder</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8]"
                placeholder="Enter folder name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8] h-32 resize-none"
                placeholder="Enter folder description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Folder
              </label>
              <select
                value={formData.parent}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, parent: e.target.value }))
                }
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8]"
              >
                <option value="">Root Directory</option>
                <option value="plans">Plans</option>
                <option value="specifications">Specifications</option>
                <option value="documents">Documents</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-[#E0E0E0]">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 text-sm border border-[#E0E0E0] rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 