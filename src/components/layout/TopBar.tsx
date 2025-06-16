'use client';

import {
  Search,
  PlusSquare,
  FolderPlus,
  ChevronDown,
  Settings,
  User,
} from 'lucide-react';
// Removed Next.js Image import due to Safari compatibility issues
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function TopBar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between w-full px-6">
      {/* Search Bar */}
      <div className="flex items-center flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search facilities..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4 ml-4">
        <button className="flex items-center px-3 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white transition">
          <FolderPlus className="w-4 h-4 mr-2" />
          New Folder
        </button>
        <button className="flex items-center px-3 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white transition">
          Actions
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* User Profile */}
      <div className="flex items-center ml-6" ref={profileRef}>
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center hover:bg-gray-800 rounded-lg p-2 transition"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1">
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <hr className="my-1 border-gray-700" />
              <button
                onClick={() => {/* Add logout logic */}}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 