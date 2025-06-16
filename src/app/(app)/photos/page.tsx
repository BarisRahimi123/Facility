'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, Filter, Grid, List, Tag } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  title: string;
  date: string;
  tags: string[];
}

const samplePhotos: Photo[] = [
  {
    id: '1',
    url: 'https://picsum.photos/400/300',
    title: 'Foundation Work',
    date: '2024-02-10',
    tags: ['foundation', 'structural'],
  },
  {
    id: '2',
    url: 'https://picsum.photos/400/500',
    title: 'Wall Assembly',
    date: '2024-02-11',
    tags: ['walls', 'construction'],
  },
  {
    id: '3',
    url: 'https://picsum.photos/400/400',
    title: 'Electrical Installation',
    date: '2024-02-12',
    tags: ['electrical', 'installation'],
  },
  {
    id: '4',
    url: 'https://picsum.photos/400/600',
    title: 'Roof Structure',
    date: '2024-02-13',
    tags: ['roof', 'structural'],
  },
];

const allTags = Array.from(
  new Set(samplePhotos.flatMap((photo) => photo.tags))
);

export default function PhotosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredPhotos = selectedTags.length
    ? samplePhotos.filter((photo) =>
        selectedTags.some((tag) => photo.tags.includes(tag))
      )
    : samplePhotos;

  return (
    <div className="h-full flex">
      {/* Filter Sidebar */}
      <div className="w-64 border-r border-[#E0E0E0] p-4 space-y-6">
        <button className="w-full flex items-center justify-center px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600">
          <Upload className="w-4 h-4 mr-2" />
          Upload Photos
        </button>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-2">
            {allTags.map((tag) => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="rounded border-gray-300 text-[#1a73e8]"
                />
                <span className="ml-2 text-sm text-gray-600">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#333333]">Photos</h1>
            <p className="text-gray-500 mt-1">
              Manage and organize project photos
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-[#1a73e8] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-[#1a73e8] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-4'
          }
        >
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`bg-white rounded-lg border border-[#E0E0E0] overflow-hidden ${
                viewMode === 'list' ? 'flex items-center' : ''
              }`}
            >
              <div
                className={`relative ${
                  viewMode === 'grid' ? 'h-48' : 'w-48 h-32 flex-shrink-0'
                }`}
              >
                <Image
                  src={photo.url}
                  alt={photo.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-medium">{photo.title}</h3>
                <div className="text-sm text-gray-500 mt-1">{photo.date}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {photo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 