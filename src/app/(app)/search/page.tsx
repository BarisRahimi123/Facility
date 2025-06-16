'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  FileText,
  Image as ImageIcon,
  File,
  Calendar,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'plan' | 'photo' | 'document' | 'form';
  title: string;
  description: string;
  date: string;
  thumbnail?: string;
  category: string;
}

const sampleResults: SearchResult[] = [
  {
    id: '1',
    type: 'plan',
    title: 'Foundation Layout Plan',
    description: 'Detailed foundation layout with measurements and specifications',
    date: '2024-02-10',
    thumbnail: 'https://picsum.photos/200/150',
    category: 'Construction Plans',
  },
  {
    id: '2',
    type: 'photo',
    title: 'Site Progress Photo',
    description: 'Weekly progress photo of the construction site',
    date: '2024-02-12',
    thumbnail: 'https://picsum.photos/200/151',
    category: 'Site Photos',
  },
  {
    id: '3',
    type: 'document',
    title: 'Safety Guidelines',
    description: 'Updated safety protocols and guidelines',
    date: '2024-02-11',
    category: 'Documentation',
  },
  {
    id: '4',
    type: 'form',
    title: 'Daily Inspection Form',
    description: 'Form template for daily site inspections',
    date: '2024-02-13',
    category: 'Forms',
  },
];

const filters = {
  type: ['All', 'Plans', 'Photos', 'Documents', 'Forms'],
  date: ['Any time', 'Past 24 hours', 'Past week', 'Past month', 'Past year'],
  category: [
    'All',
    'Construction Plans',
    'Site Photos',
    'Documentation',
    'Forms',
    'Specifications',
  ],
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    type: 'All',
    date: 'Any time',
    category: 'All',
  });

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        </div>
        {Object.entries(filters).map(([key, values]) => (
          <div key={key} className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
              {key}
            </h4>
            <div className="space-y-2">
              {values.map((value) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name={key}
                    checked={activeFilters[key as keyof typeof activeFilters] === value}
                    onChange={() =>
                      setActiveFilters((prev) => ({ ...prev, [key]: value }))
                    }
                    className="text-[#1a73e8]"
                  />
                  <span className="ml-2 text-sm text-gray-600">{value}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'plan':
        return <FileText className="w-5 h-5 text-[#1a73e8]" />;
      case 'photo':
        return <ImageIcon className="w-5 h-5 text-green-600" />;
      case 'document':
        return <File className="w-5 h-5 text-yellow-600" />;
      case 'form':
        return <FileText className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="h-full flex">
      {/* Filter Sidebar */}
      <div className="w-64 border-r border-[#E0E0E0] p-4">
        {FilterPanel}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for plans, photos, documents..."
              className="w-full pl-10 pr-4 py-3 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
            />
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="text-sm text-gray-500">
            Filtered by:{' '}
            {Object.entries(activeFilters)
              .filter(([_, value]) => value !== 'All')
              .map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-[#1a73e8] rounded-full text-xs ml-2"
                >
                  {value}
                </span>
              ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {sampleResults.map((result) => (
            <div
              key={result.id}
              className="flex items-start p-4 border border-[#E0E0E0] rounded-lg hover:shadow-md transition-shadow"
            >
              {result.thumbnail ? (
                <div className="w-48 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={result.thumbnail}
                    alt={result.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(result.type)}
                </div>
              )}
              <div className="ml-4 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-[#333333]">{result.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {result.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {result.date}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {result.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 