'use client';

import { ChevronRight, Download, MoreHorizontal, ChevronDown, Folder as FolderIcon, ChevronLeft, Plus } from 'lucide-react';
import { Category, Plan, Folder } from '@/types/plans';
import { useState, useRef, useEffect } from 'react';

interface DocumentListProps {
  categories: Category[];
  onToggleCategory: (categoryId: string) => void;
  onPlanClick: (plan: Plan) => void;
  onFolderClick?: (folder: Folder | null) => void;
  onNewPlan?: (folderId?: string) => void;
  onNewFolder?: () => void;
  onFilter?: () => void;
  onMovePlan?: (plan: Plan) => void;
  onDeletePlan?: (plan: Plan) => void;
  currentFolderId?: string;
}

interface FolderActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewPlan: () => void;
  onRename: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}

const FolderActionsMenu = ({ isOpen, onClose, onNewPlan, onRename, onDelete, style }: FolderActionsMenuProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute right-0 mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-50"
      style={style}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNewPlan();
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
      >
        New plan
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename();
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
      >
        Rename folder
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50"
      >
        Delete folder
      </button>
    </div>
  );
};

export default function DocumentList({
  categories = [],
  onToggleCategory,
  onPlanClick,
  onFolderClick,
  onNewPlan,
  onNewFolder,
  onFilter,
  onMovePlan,
  onDeletePlan,
  currentFolderId,
}: DocumentListProps) {
  const [openMenuFolderId, setOpenMenuFolderId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuFolderId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return 'Today';
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Documents</h2>
          {currentFolderId && (
            <button
              onClick={() => onFolderClick?.(null)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Back to root
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNewPlan?.()}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Plan
          </button>
          <button
            onClick={() => onNewFolder?.()}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Add Folder
          </button>
          <button
            onClick={() => onFilter?.()}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Filter
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr,80px] gap-4 px-4 py-2 text-sm text-gray-500 border-b">
            <div>Title</div>
            <div>Tasks</div>
            <div>Current version</div>
            <div>Tags</div>
            <div></div>
          </div>

          {/* Categories */}
          {(categories || []).map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Category header */}
              <button
                onClick={() => onToggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm font-medium"
              >
                {category.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {category.name} ({category.plans.length})
              </button>

              {/* Category content */}
              {category.isExpanded && (
                <div className="space-y-1">
                  {/* Folders */}
                  {category.folders?.map((folder) => (
                    <div key={folder.id} className="relative">
                      <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <FolderIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{folder.name}</span>
                          <span className="text-gray-500 text-sm">
                            ({category.plans.filter(p => p.folderId === folder.id).length} plans)
                          </span>
                        </div>
                        <button 
                          className="p-1.5 hover:bg-gray-100 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuFolderId(openMenuFolderId === folder.id ? null : folder.id);
                          }}
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                      {openMenuFolderId === folder.id && (
                        <div ref={menuRef}>
                          <FolderActionsMenu
                            isOpen={true}
                            onClose={() => setOpenMenuFolderId(null)}
                            onNewPlan={() => onNewPlan?.(folder.id)}
                            onRename={() => {
                              // TODO: Implement rename functionality
                              console.log('Rename folder:', folder.id);
                            }}
                            onDelete={() => {
                              // TODO: Implement delete functionality
                              console.log('Delete folder:', folder.id);
                            }}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Plans without folders (root level) */}
                  {category.plans
                    .filter(plan => !plan.folderId)
                    .map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => onPlanClick(plan)}
                      className="grid grid-cols-[2fr,1fr,1fr,1fr,80px] gap-4 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{plan.number}</span>
                        <span>{plan.title}</span>
                      </div>
                      <div>{plan.tasks} tasks</div>
                      <div>{plan.currentVersion}</div>
                      <div className="flex gap-1">
                        {(plan.tags || []).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-0.5 bg-gray-100 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex justify-end gap-1">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 