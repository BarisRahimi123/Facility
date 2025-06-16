'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddColumnModalProps {
  onClose: () => void;
  onAdd: (columnData: { title: string; color: string }) => void;
}

const colorOptions = [
  { label: 'Gray', value: 'bg-gray-100' },
  { label: 'Blue', value: 'bg-blue-50' },
  { label: 'Yellow', value: 'bg-yellow-50' },
  { label: 'Green', value: 'bg-green-50' },
  { label: 'Purple', value: 'bg-purple-50' },
  { label: 'Pink', value: 'bg-pink-50' },
  { label: 'Orange', value: 'bg-orange-50' },
];

export default function AddColumnModal({ onClose, onAdd }: AddColumnModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    color: 'bg-gray-100',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Column</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Column Title
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter column title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Column Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, color: color.value }))
                  }
                  className={`w-full h-10 rounded-md border ${color.value} ${
                    formData.color === color.value
                      ? 'ring-2 ring-blue-500'
                      : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              Add Column
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 