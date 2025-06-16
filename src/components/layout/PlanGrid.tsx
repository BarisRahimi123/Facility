'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plan, Category, Folder } from '@/types/plans';
import { FolderIcon, FolderOpenIcon, ChevronDown, MoreVertical, Move, Trash, Share, Replace, Plus, FileText } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import MovePlanDialog from '@/components/plans/MovePlanDialog';

interface PlanGridProps {
  categories: Category[];
  onPlanClick: (plan: Plan) => void;
  onFolderClick?: (folder: Folder) => void;
  onMovePlan?: (planId: string, folderId: string) => void;
  onDeletePlan?: (planId: string) => void;
  onReplacePlan?: (planId: string) => void;
  onSharePlan?: (planId: string) => void;
  onNewPlan?: (folderId?: string) => void;
}

interface PlanCardProps {
  plan: Plan;
  onClick: () => void;
}

const PlanCard = ({ plan, onClick }: PlanCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded border border-[#DDDDDD] hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col relative"
    >
      <div className="relative aspect-[1/1.414] bg-gray-50">
        {plan.thumbnail_url ? (
          <Image
            src={plan.thumbnail_url}
            alt={plan.title}
            fill
            className="object-contain bg-white"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <FileText className="w-12 h-12" />
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#DDDDDD] flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[#1a73e8] bg-blue-50 px-2 py-1 rounded-md">
            {plan.number || 'No number'}
          </div>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded-md">Plan</div>
        </div>
        <div className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {plan.title || 'Untitled'}
        </div>
        {plan.lastModified && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span>Modified:</span>
            <span>{new Date(plan.lastModified).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function PlanGrid({ 
  categories, 
  onPlanClick, 
  onFolderClick,
  onMovePlan,
  onDeletePlan,
  onReplacePlan,
  onSharePlan,
  onNewPlan
}: PlanGridProps) {
  const [draggedPlan, setDraggedPlan] = useState<Plan | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Keep track of the last active folder when a plan is added
  const [lastActiveFolderId, setLastActiveFolderId] = useState<string | null>(null);

  useEffect(() => {
    // When a new plan is added, expand its folder
    if (lastActiveFolderId) {
      setExpandedFolders(prev => new Set([...prev, lastActiveFolderId]));
    }
  }, [categories]); // This will run whenever the categories (including plans) change

  const handleDragStart = (plan: Plan) => {
    setDraggedPlan(plan);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDropTargetId(folderId);
  };

  const handleDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedPlan && onMovePlan) {
      onMovePlan(draggedPlan.id, folderId);
    }
    setDraggedPlan(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedPlan(null);
    setDropTargetId(null);
  };

  const handleMoveClick = (planId: string) => {
    setSelectedPlanId(planId);
    setMoveDialogOpen(true);
  };

  const handleMove = (folderId: string) => {
    if (selectedPlanId && onMovePlan) {
      onMovePlan(selectedPlanId, folderId);
    }
    setSelectedPlanId(null);
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Update lastActiveFolderId when adding a new plan
  const handleNewPlan = (folderId?: string) => {
    setLastActiveFolderId(folderId || null);
    onNewPlan?.(folderId);
  };

  return (
    <>
      {/* Folders Table View */}
      <div className="mb-6 divide-y border rounded-lg">
        {categories.map((category) => (
          <div key={category.id}>
            {category.folders?.map((folder) => (
              <div key={folder.id}>
                <div
                  onClick={() => onFolderClick?.(folder)}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    dropTargetId === folder.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={(e) => toggleFolder(folder.id, e)}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <FolderOpenIcon className="w-5 h-5 text-gray-400 fill-current" />
                      ) : (
                        <FolderIcon className="w-5 h-5 text-gray-400 fill-current" />
                      )}
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${
                        expandedFolders.has(folder.id) ? 'rotate-180' : ''
                      }`} />
                    </div>
                    <span className="text-sm font-medium">{folder.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({category.plans.filter(plan => plan.folderId === folder.id).length} plans)
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last modified: {new Date().toLocaleDateString()}
                  </div>
                </div>
                
                {/* Folder Contents */}
                {expandedFolders.has(folder.id) && (
                  <div className="grid auto-rows-[200px] grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[10px] p-4 bg-white">
                    {/* Plans */}
                    {category.plans
                      .filter(plan => plan.folderId === folder.id)
                      .map((plan) => (
                        <PlanCard
                          key={plan.id}
                          plan={plan}
                          onClick={() => onPlanClick(plan)}
                        />
                      ))}

                    {/* Add New Plan Button */}
                    <button
                      onClick={() => handleNewPlan(folder.id)}
                      className="h-[200px] bg-white rounded border border-dashed border-[#DDDDDD] hover:border-[#1a73e8] transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1a73e8] bg-opacity-10 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-[#1a73e8]" />
                      </div>
                      <span className="text-[#1a73e8] text-sm font-medium">Add New Plan</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Plans Grid View (for plans not in folders) */}
      <div className="grid auto-rows-[200px] grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-[10px]">
        {/* Plans */}
        {categories.flatMap((category) => 
          category.plans
            .filter(plan => !plan.folderId)
            .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onClick={() => onPlanClick(plan)}
              />
            ))
        )}

        {/* Add New Plan Button */}
        <button
          onClick={() => handleNewPlan(undefined)}
          className="h-[200px] bg-white rounded border border-dashed border-[#DDDDDD] hover:border-[#1a73e8] transition-colors flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-[#1a73e8] bg-opacity-10 flex items-center justify-center">
            <Plus className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <span className="text-[#1a73e8] text-sm font-medium">Add New Plan</span>
        </button>
      </div>

      <MovePlanDialog
        isOpen={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        onMove={handleMove}
        categories={categories}
      />
    </>
  );
} 