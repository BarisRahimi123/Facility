'use client';

import { useState } from 'react';
import ModalLayout from '../layout/ModalLayout';

interface AddCategoryModalProps {
  onClose: () => void;
  onAdd: (category: string) => void;
  existingCategories: string[];
}

export default function AddCategoryModal({
  onClose,
  onAdd,
  existingCategories,
}: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate category name
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (existingCategories.includes(categoryName.trim())) {
      setError('Category already exists');
      return;
    }

    onAdd(categoryName.trim());
    onClose();
  };

  return (
    <ModalLayout
      title="Add New Category"
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
            form="add-category-form"
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          >
            Add Category
          </button>
        </>
      }
    >
      <form id="add-category-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => {
              setCategoryName(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8]"
            placeholder="Enter category name"
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>
    </ModalLayout>
  );
} 