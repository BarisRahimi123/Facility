'use client';

import { useState } from 'react';
import { Plan, Folder } from '@/types/plans';
import { FileText, MoreVertical, Share2, FolderOpen, Pencil, Trash2, ChevronRight, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import Image from 'next/image';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDate } from '@/utils/formatDate';

interface PlansTableProps {
  plans: Plan[];
  folders: Folder[];
  viewMode: 'table' | 'grid';
  onPlanClick: (plan: Plan) => void;
  onMovePlan?: (planId: string, folderId: string) => void;
  onDeletePlan?: (planId: string) => void;
  onReplacePlan?: (planId: string) => void;
  onSharePlan?: (planId: string) => void;
}

export default function PlansTable({
  plans,
  folders,
  viewMode,
  onPlanClick,
  onMovePlan,
  onDeletePlan,
  onReplacePlan,
  onSharePlan,
}: PlansTableProps) {
  const [sortField, setSortField] = useState<keyof Plan>('number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleSort = (field: keyof Plan) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const sortedPlans = [...plans].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }
    return 0;
  });

  const renderSortIcon = (field: keyof Plan) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onPlanClick(plan)}
          >
            <div className="relative aspect-[4/3] bg-gray-50">
              {plan.thumbnail ? (
                <Image
                  src={plan.thumbnail}
                  alt={plan.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-sm">
                {plan.number}
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-medium text-gray-900 truncate">{plan.title}</h3>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="p-1 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                    <DropdownMenu.Item
                      onSelect={() => onSharePlan?.(plan.id)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => onMovePlan?.(plan.id, '')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Move
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => onReplacePlan?.(plan.id)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Replace
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => onDeletePlan?.(plan.id)}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>Category: {plan.category}</div>
                {plan.dsaNumber && <div>DSA: {plan.dsaNumber}</div>}
                <div>Modified {formatDate(plan.updated_at || '')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group plans by folder
  const plansByFolder = new Map<string | null, Plan[]>();
  plansByFolder.set(null, []); // For plans without folders

  sortedPlans.forEach(plan => {
    const folderId = plan.folderId || null;
    if (!plansByFolder.has(folderId)) {
      plansByFolder.set(folderId, []);
    }
    plansByFolder.get(folderId)!.push(plan);
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('number')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center"
                >
                  Number {renderSortIcon('number')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center"
                >
                  Title {renderSortIcon('title')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('category')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center"
                >
                  Category {renderSortIcon('category')}
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-sm font-medium text-gray-500">
                  DSA Number
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('updated_at')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center"
                >
                  Last Modified {renderSortIcon('updated_at')}
                </button>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-sm font-medium text-gray-500">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {folders.map(folder => {
              const folderPlans = plansByFolder.get(folder.id) || [];
              const isExpanded = expandedFolders.has(folder.id);

              return (
                <>
                  <tr key={folder.id} className="bg-gray-50">
                    <td colSpan={6} className="px-6 py-3">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 mr-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-2" />
                        )}
                        <FolderIcon className="w-4 h-4 mr-2 text-gray-400" />
                        {folder.name}
                        <span className="ml-2 text-gray-400">
                          ({folderPlans.length} plans)
                        </span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && folderPlans.map(plan => (
                    <tr
                      key={plan.id}
                      onClick={() => onPlanClick(plan)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 pl-12">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-blue-600">
                            {plan.number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{plan.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{plan.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{plan.dsaNumber || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {formatDate(plan.updated_at || '')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSharePlan?.(plan.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMovePlan?.(plan.id, '');
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReplacePlan?.(plan.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlan?.(plan.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              );
            })}
            {/* Show plans without folders */}
            {plansByFolder.get(null)?.map(plan => (
              <tr
                key={plan.id}
                onClick={() => onPlanClick(plan)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-blue-600">
                      {plan.number}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">{plan.title}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{plan.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">{plan.dsaNumber || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {formatDate(plan.updated_at || '')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSharePlan?.(plan.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePlan?.(plan.id, '');
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplacePlan?.(plan.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlan?.(plan.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}