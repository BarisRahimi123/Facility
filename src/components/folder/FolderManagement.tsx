'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import FolderHeader from './FolderHeader';
import FolderDropdown from './FolderDropdown';

interface FolderManagementProps {
  name: string;
  planCount: number;
  onNewPlan: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export default function FolderManagement({
  name,
  planCount,
  onNewPlan,
  onRename,
  onDelete
}: FolderManagementProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group">
      <div className="flex items-center justify-between">
        <FolderHeader
          name={name}
          planCount={planCount}
          onClick={() => setIsDropdownOpen(false)}
        />
        <button 
          className="p-1.5 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity mr-4"
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div ref={dropdownRef}>
        <FolderDropdown
          isOpen={isDropdownOpen}
          onNewPlan={() => {
            onNewPlan();
            setIsDropdownOpen(false);
          }}
          onRename={() => {
            onRename();
            setIsDropdownOpen(false);
          }}
          onDelete={() => {
            onDelete();
            setIsDropdownOpen(false);
          }}
        />
      </div>
    </div>
  );
} 