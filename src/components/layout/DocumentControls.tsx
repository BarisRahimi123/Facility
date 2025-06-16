'use client';

import { Plus, Filter } from 'lucide-react';

interface DocumentControlsProps {
  onNewPlan: () => void;
  onNewFolder: () => void;
  onFilter: () => void;
}

export default function DocumentControls({
  onNewPlan,
  onNewFolder,
  onFilter,
}: DocumentControlsProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onNewPlan}
          className="px-3 py-1.5 bg-blue-600 text-white rounded flex items-center text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          New plan
        </button>
        <button
          onClick={onNewFolder}
          className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
        >
          + New folder
        </button>
        <button className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
          Actions
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onFilter}
          className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50 flex items-center"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filter plans
        </button>
        <button className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
          Version control
        </button>
      </div>
    </div>
  );
} 