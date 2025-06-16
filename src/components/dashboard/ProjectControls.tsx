'use client';

import { Search, Plus, Filter, Grid, List } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProjectControlsProps {
  onSearch: (query: string) => void;
  onSort: (option: string) => void;
  onFilter: () => void;
  onNewProject?: () => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
}

export default function ProjectControls({
  onSearch,
  onSort,
  onFilter,
  onNewProject,
  view,
  onViewChange,
}: ProjectControlsProps) {
  const router = useRouter();

  const handleNewProject = () => {
    if (onNewProject) {
      onNewProject();
    } else {
      router.push('/projects/new');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search projects..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-64 pl-10 pr-4 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
          />
        </div>

        <select
          onChange={(e) => onSort(e.target.value)}
          className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#1a73e8]"
        >
          <option value="recent">Recently visited</option>
          <option value="name">Name</option>
          <option value="tasks">Most tasks</option>
          <option value="plans">Most plans</option>
        </select>

        <button
          onClick={onFilter}
          className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm hover:bg-gray-50 flex items-center"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange('grid')}
            className={`p-2 rounded-lg ${
              view === 'grid'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`p-2 rounded-lg ${
              view === 'list'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleNewProject}
          className="px-4 py-2 bg-[#2F80ED] text-white rounded-lg text-sm hover:bg-blue-600 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>
    </div>
  );
} 