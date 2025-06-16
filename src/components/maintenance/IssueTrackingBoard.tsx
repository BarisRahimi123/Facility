'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle, Settings, UserPlus, Share2, MoreHorizontal, Paperclip, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';

// Extend the MaintenanceTask type with the properties we need
interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  assignedTo?: string;
  location?: string;
  hasEstimates?: boolean;
  dueDate?: string;
  comments?: number;
  attachments?: string[];
  facilityId?: string;
  facilityName?: string;
}

interface IssueTrackingBoardProps {
  tasks: MaintenanceTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<MaintenanceTask>) => void;
  onTaskClick?: (task: MaintenanceTask) => void;
  facilityId?: string;
}

// Interfaces for the modal components
interface ModalProps {
  task: MaintenanceTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AssignTaskModalProps extends ModalProps {
  onAssign: (assigneeId: string) => void;
}

interface TaskDetailsModalProps extends ModalProps {
  onUpdate: (updates: Partial<MaintenanceTask>) => void;
}

// Placeholder components - using React.FC type to avoid JSX namespace errors
const AssignTaskModal: React.FC<AssignTaskModalProps> = () => null;
const ShareTaskModal: React.FC<ModalProps> = () => null;
const TaskDetailsModal: React.FC<TaskDetailsModalProps> = () => null;
const RequestForQuoteModal: React.FC<ModalProps & { facilityId?: string }> = () => null;
const EstimateReviewModal: React.FC<ModalProps> = () => null;

// Memoized task card component to prevent unnecessary re-renders
const TaskCard = memo(({ task, index, onClick }: { 
  task: MaintenanceTask; 
  index: number;
  onClick?: (task: MaintenanceTask) => void;
}) => {
  const handleClick = useCallback(() => {
    if (onClick) onClick(task);
  }, [onClick, task]);

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
  };

  const priorityColor = priorityColors[task.priority] || priorityColors.low;
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-2 hover:shadow-md transition-shadow"
          onClick={handleClick}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  if (onClick) onClick(task);
                }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  Assign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="mb-2">
            <Badge variant="outline" className={`${priorityColor} text-xs`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            {task.facilityName && (
              <Badge variant="outline" className="ml-1 text-xs">
                {task.facilityName}
              </Badge>
            )}
          </div>
          
          {task.description && (
            <p className="text-gray-600 text-xs mb-2 line-clamp-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              {task.assignedTo ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`https://avatar.vercel.sh/${task.assignedTo}`} />
                        <AvatarFallback>{task.assignedTo.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.assignedTo}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
              
              {task.location && (
                <span className="truncate max-w-[100px]">{task.location}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {task.attachments && task.attachments.length > 0 && (
                <span className="flex items-center">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {task.attachments.length}
                </span>
              )}
              
              {task.comments && (
                <span className="flex items-center">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {task.comments}
                </span>
              )}
              
              {task.dueDate && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

TaskCard.displayName = 'TaskCard';

// Memoized column component to prevent unnecessary re-renders
const TaskColumn = memo(({ 
  title, 
  tasks, 
  droppableId, 
  onTaskClick 
}: { 
  title: string; 
  tasks: MaintenanceTask[]; 
  droppableId: string;
  onTaskClick?: (task: MaintenanceTask) => void;
}) => {
  // Create a virtualizer for the tasks
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height of each task card
    overscan: 5, // Number of items to render outside of the visible area
  });

  return (
    <div className="bg-gray-50 rounded-md p-2 w-full min-w-[250px] max-w-[350px] flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="font-medium text-sm">{title} ({tasks.length})</h3>
      </div>
      
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 overflow-y-auto"
            style={{ height: 'calc(100vh - 300px)' }}
          >
            <div ref={parentRef} className="h-full overflow-auto">
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                  <div
                    key={tasks[virtualRow.index].id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TaskCard 
                      task={tasks[virtualRow.index]} 
                      index={virtualRow.index} 
                      onClick={onTaskClick}
                    />
                  </div>
                ))}
              </div>
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
});

TaskColumn.displayName = 'TaskColumn';

export default function IssueTrackingBoard({
  tasks = [],
  onTaskUpdate,
  onTaskClick,
  facilityId
}: IssueTrackingBoardProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [isEstimateModalOpen, setIsEstimateModalOpen] = useState(false);

  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups = {
      open: [] as MaintenanceTask[],
      inProgress: [] as MaintenanceTask[],
      completed: [] as MaintenanceTask[],
      closed: [] as MaintenanceTask[],
    };

    tasks.forEach(task => {
      switch (task.status) {
        case 'pending':
          groups.open.push(task);
          break;
        case 'in_progress':
          groups.inProgress.push(task);
          break;
        case 'completed':
          groups.completed.push(task);
          break;
        case 'cancelled':
          groups.closed.push(task);
          break;
        default:
          groups.open.push(task);
      }
    });

    return groups;
  }, [tasks]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination || !onTaskUpdate) return;
    
    const { source, destination, draggableId } = result;
    
    // If dropped in a different column, update the task status
    if (source.droppableId !== destination.droppableId) {
      onTaskUpdate(draggableId, { status: destination.droppableId as MaintenanceTask['status'] });
    }
  }, [onTaskUpdate]);

  const handleTaskClick = useCallback((task: MaintenanceTask) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
    if (onTaskClick) {
      setTimeout(() => {
        onTaskClick(task);
      }, 0);
    }
  }, [onTaskClick]);

  const handleAssignClick = useCallback((task: MaintenanceTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsAssignModalOpen(true);
  }, []);

  const handleShareClick = useCallback((task: MaintenanceTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsShareModalOpen(true);
  }, []);

  const handleRFQClick = useCallback((task: MaintenanceTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsRFQModalOpen(true);
  }, []);

  const handleEstimateClick = useCallback((task: MaintenanceTask, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTask(task);
    setIsEstimateModalOpen(true);
  }, []);

  const handleSettingsClick = useCallback(() => {
    router.push('/maintenance/settings');
  }, [router]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Maintenance Tasks</h1>
        <Button onClick={handleSettingsClick} variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
          <TaskColumn 
            title="Open" 
            tasks={groupedTasks.open} 
            droppableId="open" 
            onTaskClick={onTaskClick}
          />
          <TaskColumn 
            title="In Progress" 
            tasks={groupedTasks.inProgress} 
            droppableId="inProgress" 
            onTaskClick={onTaskClick}
          />
          <TaskColumn 
            title="Completed" 
            tasks={groupedTasks.completed} 
            droppableId="completed" 
            onTaskClick={onTaskClick}
          />
          <TaskColumn 
            title="Closed" 
            tasks={groupedTasks.closed} 
            droppableId="closed" 
            onTaskClick={onTaskClick}
          />
        </div>
      </DragDropContext>

      {selectedTask && (
        <>
          <AssignTaskModal
            task={selectedTask}
            open={isAssignModalOpen}
            onOpenChange={setIsAssignModalOpen}
            onAssign={(assigneeId) => {
              onTaskUpdate?.(selectedTask.id, { assignedTo: assigneeId });
            }}
          />
          <ShareTaskModal
            task={selectedTask}
            open={isShareModalOpen}
            onOpenChange={setIsShareModalOpen}
          />
          <TaskDetailsModal
            task={selectedTask}
            open={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            onUpdate={(updates) => {
              onTaskUpdate?.(selectedTask.id, updates);
            }}
          />
          <RequestForQuoteModal
            task={selectedTask}
            open={isRFQModalOpen}
            onOpenChange={setIsRFQModalOpen}
            facilityId={facilityId}
          />
          <EstimateReviewModal
            task={selectedTask}
            open={isEstimateModalOpen}
            onOpenChange={setIsEstimateModalOpen}
          />
        </>
      )}
    </div>
  );
} 