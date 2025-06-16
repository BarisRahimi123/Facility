'use client';

import { Folder } from 'lucide-react';

interface FolderHeaderProps {
  name: string;
  planCount: number;
  onClick: () => void;
}

export default function FolderHeader({ name, planCount, onClick }: FolderHeaderProps) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer"
    >
      <Folder className="w-5 h-5 text-gray-400" />
      <span className="text-[#333333] font-medium">{name}</span>
      <span className="text-gray-500 text-sm">({planCount} plans)</span>
    </div>
  );
} 