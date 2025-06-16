'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Upload,
  Download,
  Trash2,
  Share2,
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  children?: FileItem[];
}

const fileStructure: FileItem[] = [
  {
    id: '1',
    name: 'Project Documents',
    type: 'folder',
    modified: '2024-02-13',
    children: [
      {
        id: '1-1',
        name: 'Specifications',
        type: 'folder',
        modified: '2024-02-12',
        children: [
          {
            id: '1-1-1',
            name: 'Technical Requirements.pdf',
            type: 'file',
            size: '2.4 MB',
            modified: '2024-02-12',
          },
        ],
      },
      {
        id: '1-2',
        name: 'Contract.pdf',
        type: 'file',
        size: '1.2 MB',
        modified: '2024-02-13',
      },
    ],
  },
  {
    id: '2',
    name: 'Site Photos',
    type: 'folder',
    modified: '2024-02-11',
    children: [
      {
        id: '2-1',
        name: 'Progress Report.docx',
        type: 'file',
        size: '856 KB',
        modified: '2024-02-11',
      },
    ],
  },
];

function FileTreeItem({ item, level = 0 }: { item: FileItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <div
        className={`flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer ${
          level === 0 ? '' : 'ml-6'
        }`}
      >
        <div className="flex items-center flex-1">
          {item.type === 'folder' && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-gray-100 rounded mr-1"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          )}
          {item.type === 'folder' ? (
            <Folder className="w-5 h-5 text-[#1a73e8] mr-2" />
          ) : (
            <File className="w-5 h-5 text-gray-400 mr-2" />
          )}
          <span className="text-sm">{item.name}</span>
        </div>
        <div className="flex items-center space-x-4">
          {item.size && (
            <span className="text-sm text-gray-500">{item.size}</span>
          )}
          <span className="text-sm text-gray-500">
            {new Date(item.modified).toLocaleDateString()}
          </span>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      {item.type === 'folder' && isOpen && item.children && (
        <div className="mt-1">
          {item.children.map((child) => (
            <FileTreeItem key={child.id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilesPage() {
  const stats = [
    { label: 'Total Files', value: '45' },
    { label: 'Total Size', value: '2.3 GB' },
    { label: 'Folders', value: '12' },
    { label: 'Shared Files', value: '8' },
  ];

  const ActionPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center p-2 text-sm text-[#1a73e8] hover:bg-blue-50 rounded-lg">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </button>
          <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            <Download className="w-4 h-4 mr-2" />
            Download Selected
          </button>
          <button className="w-full flex items-center p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
            <Share2 className="w-4 h-4 mr-2" />
            Share Files
          </button>
          <button className="w-full flex items-center p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Storage Usage</h3>
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div className="bg-[#1a73e8] h-full rounded-full w-3/4"></div>
        </div>
        <div className="text-sm text-gray-500">
          1.7 GB used of 2.5 GB
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout stats={stats} sidePanel={ActionPanel}>
      <div className="bg-white rounded-lg border border-[#E0E0E0]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#333333]">Files</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm text-white bg-[#1a73e8] rounded-lg hover:bg-blue-600">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
            <button className="flex items-center px-3 py-2 text-sm text-gray-700 border border-[#E0E0E0] rounded-lg hover:bg-gray-50">
              <Folder className="w-4 h-4 mr-2" />
              New Folder
            </button>
          </div>
        </div>

        {/* File Tree */}
        <div className="divide-y divide-[#E0E0E0]">
          {fileStructure.map((item) => (
            <FileTreeItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 