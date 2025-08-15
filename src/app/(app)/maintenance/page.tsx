'use client';

import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react';
import { Plus, Calendar as CalendarIcon, List, Share2, LayoutGrid, Filter, Search, Sliders, ExternalLink, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import MaintenanceCalendar from '@/components/maintenance/MaintenanceCalendar';
import MaintenanceTable from '@/components/maintenance/MaintenanceTable';
import type { MaintenanceTask, RequestForQuote, VendorEstimate, PurchaseOrder, Vendor } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, MessageSquare, Copy } from 'lucide-react';
import ShareReportModal from '@/components/maintenance/ShareReportModal';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import ShareIssueFormButton from '@/components/maintenance/ShareIssueFormButton';
import { IssueReportModal } from '@/components/maintenance/IssueReportModal';
import { getMaintenanceTasks, updateMaintenanceTask } from '@/app/actions/maintenance';
import { getAllFacilities } from '@/app/actions/facilities';
import { getBuildings, getRooms } from '@/app/actions/buildings';
import { getFields } from '@/app/actions/fields';





// Temporary mock data for vendors
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'ACME Repairs',
    email: 'contact@acmerepairs.com',
    phone: '555-0123',
    address: '123 Main St, Anytown, CA 12345',
    specialties: ['HVAC', 'Electrical'],
    rating: 4.5,
    isApproved: true,
  },
  {
    id: '2',
    name: 'Best Fix Services',
    email: 'info@bestfix.com',
    phone: '555-0124',
    address: '456 Oak Ave, Somewhere, CA 12346',
    specialties: ['Plumbing', 'Structural'],
    rating: 4.8,
    isApproved: true,
  },
];

// Interface for the Supabase response format
interface RFQLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface VendorEstimateData {
  id: string;
  rfq_id: string;
  vendor_id: string;
  status: VendorEstimate['status'];
  total_amount: number;
  estimated_duration: number;
  availability_date: string;
  expiry_date: string;
  estimate_line_items?: RFQLineItem[];
  terms?: string;
  notes?: string;
  attachments?: string[];
  submitted_at: string;
}

interface RFQData {
  id: string;
  task_id: string;
  status: RequestForQuote['status'];
  title: string;
  description: string;
  scope: string;
  required_completion_date: string;
  vendor_ids: string[];
  sent_date: string;
  due_date: string;
  attachments?: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  vendor_estimates?: VendorEstimateData[];
}

// Type adapter for IssueTrackingBoard component
interface BoardMaintenanceTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  assignedTo?: string;
  location?: string;
  hasEstimates?: boolean;
}

// Function to adapt MaintenanceTask to BoardMaintenanceTask
const adaptTaskForBoard = (task: MaintenanceTask): BoardMaintenanceTask => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    // Map 'new' status to 'pending' for the board component
    status: task.status === 'new' ? 'pending' : task.status,
    // Handle 'critical' priority by mapping to 'high'
    priority: task.priority === 'critical' ? 'high' : task.priority,
    createdAt: task.createdAt || new Date().toISOString(),
    assignedTo: task.assignedTo,
    location: task.location,
    // Safely check for estimates
    hasEstimates: false // Simplified for now
  };
};

// Function to handle board task updates
const adaptBoardUpdateToTask = (taskId: string, updates: Partial<BoardMaintenanceTask>): Partial<MaintenanceTask> => {
  const result: Partial<MaintenanceTask> = {};
  
  if (updates.title) result.title = updates.title;
  if (updates.description) result.description = updates.description;
  if (updates.status) result.status = updates.status;
  if (updates.priority) result.priority = updates.priority;
  if (updates.assignedTo) result.assignedTo = updates.assignedTo;
  if (updates.location) result.location = updates.location;
  
  return result;
};

// Lazy load components with proper loading fallbacks
const MaintenanceTaskModal = dynamic(() => import('@/components/maintenance/MaintenanceTaskModal'), {
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>,
  ssr: false
});

const PurchaseOrderModal = dynamic(() => import('@/components/maintenance/PurchaseOrderModal'), {
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>,
  ssr: false
});

const MaintenanceTaskView = dynamic(() => import('@/components/maintenance/MaintenanceTaskView'), {
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>,
  ssr: false
});

const PurchaseOrderView = dynamic(() => import('@/components/maintenance/PurchaseOrderView'), {
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>,
  ssr: false
});

// Lazy load the IssueTrackingBoard component with proper error boundary
const IssueTrackingBoard = dynamic(() => import('@/components/maintenance/IssueTrackingBoard'), {
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>,
  ssr: false
});

export default function MaintenancePage() {
  const router = useRouter();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPurchaseOrderModalOpen, setIsPurchaseOrderModalOpen] = useState(false);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'board'>('board');
  const [activeTab, setActiveTab] = useState<'tasks' | 'orders' | 'issues'>('issues');
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState<string>('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [assignmentType, setAssignmentType] = useState<'internal' | 'contractor' | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);
  const [isIssueReportModalOpen, setIsIssueReportModalOpen] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeActionTab, setActiveActionTab] = useState<'new' | 'pending' | 'escalated'>('new');

  // Mock data for team members and contractors
  const teamMembers = [
    { id: '1', name: 'John Smith', role: 'Maintenance Manager' },
    { id: '2', name: 'Sarah Johnson', role: 'Facility Technician' },
    { id: '3', name: 'Mike Brown', role: 'HVAC Specialist' },
  ];

  const contractors = [
    { id: '1', name: 'ABC Maintenance Services', specialties: ['HVAC', 'Electrical'] },
    { id: '2', name: 'XYZ Facility Solutions', specialties: ['Plumbing', 'Structural'] },
    { id: '3', name: 'Quality Repairs Inc.', specialties: ['General Maintenance', 'Security'] },
  ];

  const handleCreateTask = async (data: Partial<MaintenanceTask>) => {
    // The modal now handles creation directly with server action
    // Just refresh the tasks list
    await loadTasks();
  };

  // Replace the loadTasks function with this
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksData = await getMaintenanceTasks(selectedFacility);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load maintenance tasks.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedFacility, toast]);

  const loadAllData = useCallback(async () => {
    try {
      // Load facilities
      const facilitiesData = await getAllFacilities();
      setFacilities(facilitiesData);

      // Load buildings
      const buildingsData = await getBuildings();
      setBuildings(buildingsData);

      // Load rooms for all buildings
      const allRooms = [];
      for (const building of buildingsData) {
        try {
          const buildingRooms = await getRooms(building.id);
          allRooms.push(...buildingRooms);
        } catch (error) {
          console.warn(`Failed to load rooms for building ${building.id}:`, error);
        }
      }
      setRooms(allRooms);

      // Load fields for all facilities
      const allFields = [];
      for (const facility of facilitiesData) {
        try {
          const facilityFields = await getFields(facility.id);
          allFields.push(...facilityFields);
        } catch (error) {
          console.warn(`Failed to load fields for facility ${facility.id}:`, error);
        }
      }
      setFields(allFields);
      setDataLoaded(true); // Mark as loaded

    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error", 
        description: "Failed to load facility data",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load all data on component mount
  useEffect(() => {
    if (!dataLoaded) {
      loadAllData();
    }
  }, []); // Empty dependency array - only run once on mount

  // Load tasks when facility changes with proper cleanup
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await loadTasks();
      }
    };
    
    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
    // Remove loadTasks from the dependency array to avoid potential infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacility]);

  // Separate useEffect for BroadcastChannel with proper cleanup
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    let isMounted = true;
    
    try {
      bc = new BroadcastChannel('tasks-update');
      bc.onmessage = (event) => {
        if (event.data.type === 'new-task' && isMounted) {
          loadTasks();
          toast({
            title: "New Task Added",
            description: "A new maintenance task has been added to the board.",
          });
        }
      };
    } catch (error) {
      console.error('Error setting up BroadcastChannel:', error);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      if (bc) {
        bc.close();
      }
    };
    // Remove loadTasks from the dependency array to avoid potential infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Add cleanup when component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any timers, event listeners, or other resources
      // Clear session storage if needed
      // sessionStorage.removeItem(`tasks_${selectedFacility}`);
    };
  }, []);

  const handleCreatePO = (data: Partial<PurchaseOrder>) => {
    const newPO: PurchaseOrder = {
      id: Math.random().toString(),
      poNumber: `PO-${Math.floor(Math.random() * 10000)}`,
      maintenanceId: '',
      vendorId: data.vendorId || '',
      status: 'draft',
      items: data.items || [],
      totalAmount: data.totalAmount || 0,
      requestedBy: 'John Doe',
      requestDate: new Date().toISOString(),
      ...data,
    };

    setPurchaseOrders([...purchaseOrders, newPO]);
    setIsPurchaseOrderModalOpen(false);
  };

  // Optimize handleTaskClick with useCallback
  const handleTaskClick = useCallback((task: MaintenanceTask) => {
    if (!selectedTask || selectedTask.id !== task.id) {
      setSelectedTask(task);
    }
  }, [selectedTask]);

  const handlePOClick = (po: PurchaseOrder) => {
    const vendor = mockVendors.find(v => v.id === po.vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      setSelectedPO(po);
    }
  };

  const handleTimeSlotSelect = (start: Date, end: Date) => {
    setIsTaskModalOpen(true);
    // Pre-fill the task form with the selected time slot
    handleCreateTask({
      startDate: start.toISOString(),
      estimatedDuration: Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // Convert to minutes
    });
  };

  // Update the handleTaskUpdate function
  const handleTaskUpdate = async (taskId: string, updates: Partial<MaintenanceTask>) => {
    const result = await updateMaintenanceTask(taskId, updates);
    
    if (result.success) {
      await loadTasks();
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (type: 'email' | 'sms' | 'copy') => {
    // Use the known working token
    const token = '26592d3d5252b81356c48e30639dd3b766655042471b30997e7cbcc7ad0c8745';
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/report/${token}?system=HVAC&location=Building+A`;
    
    try {
      if (type === 'copy') {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Success",
          description: "Link copied to clipboard!",
        });
      } else {
        setShareUrl(url);
        setIsShareModalOpen(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update the handleStatusChange function
  const handleStatusChange = async (taskId: string, newStatus: MaintenanceTask['status']) => {
    const result = await updateMaintenanceTask(taskId, { status: newStatus });
    
    if (result.success) {
      await loadTasks();
      toast({
        title: "Task Updated",
        description: "Task status has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  // Memoize expensive operations
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.type.toLowerCase().includes(query) ||
          task.priority.toLowerCase().includes(query) ||
          task.status.toLowerCase().includes(query)
        );
      }
      
      if (facilityFilter !== 'all') {
        return task.facilityId === facilityFilter;
      }
      
      return true;
    });
  }, [tasks, searchQuery, facilityFilter]);

  // Paginate the filtered tasks
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredTasks, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTasks.length / itemsPerPage);
  }, [filteredTasks.length, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, facilityFilter]);

  // Add pagination controls component
  const PaginationControls = () => {
    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-card/50 border-t border-border sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-300">
              Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
              </span>{' '}
              of <span className="font-medium text-white">{filteredTasks.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-700 bg-gray-800 text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-purple-600 border-purple-500 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium ${
                  currentPage === totalPages || totalPages === 0 ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // Add error boundary for the entire component
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Caught error:', event.error);
      toast({
        title: "Error",
        description: "Something went wrong. Please refresh the page.",
        variant: "destructive",
      });
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [toast]);

  // Add navigation performance optimization
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save important state to sessionStorage before navigating away
      sessionStorage.setItem('maintenance_state', JSON.stringify({
        selectedFacility,
        viewMode,
        activeTab,
        currentPage,
        searchQuery
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Try to restore state on mount
    const savedState = sessionStorage.getItem('maintenance_state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.selectedFacility) setSelectedFacility(parsedState.selectedFacility);
        if (parsedState.viewMode) setViewMode(parsedState.viewMode as any);
        if (parsedState.activeTab) setActiveTab(parsedState.activeTab as any);
        if (parsedState.currentPage) setCurrentPage(parsedState.currentPage);
        if (parsedState.searchQuery) setSearchQuery(parsedState.searchQuery);
      } catch (e) {
        console.error('Error restoring state:', e);
      }
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedFacility, viewMode, activeTab, currentPage, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Maintenance Management</h1>
            <p className="text-gray-400">Track and manage maintenance tasks, purchase orders, and issues</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
            <Button
              onClick={() => setIsPurchaseOrderModalOpen(true)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              New PO
            </Button>
            <Button
              onClick={() => setIsIssueReportModalOpen(true)}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-950/50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Issue
            </Button>
            <ShareIssueFormButton />
          </div>
        </div>

        {/* Filters Section */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-gray-400 mb-2">Facility</Label>
                <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-gray-200">
                    <SelectValue placeholder="Select Facility" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Facilities</SelectItem>
                    {facilities.map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-gray-400 mb-2">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-gray-200">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-gray-400 mb-2">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-gray-200">
                    <SelectValue placeholder="Filter by Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-gray-400 mb-2">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700 text-gray-200 placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Toggle and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('board')}
              className={viewMode === 'board' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
            >
              <List className="w-4 h-4 mr-2" />
              Table
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-purple-600 text-white border-purple-600' : 'text-gray-400 hover:text-white hover:bg-gray-800'}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Sliders className="w-4 h-4 mr-2" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 focus:text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 focus:text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6">
          {viewMode === 'board' && (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                }>
                  <IssueTrackingBoard
                    tasks={tasks.map(adaptTaskForBoard)}
                    onTaskUpdate={(taskId, updates) => {
                      const taskUpdates = adaptBoardUpdateToTask(taskId, updates);
                      handleTaskUpdate(taskId, taskUpdates);
                    }}
                  />
                </Suspense>
              </CardContent>
            </Card>
          )}

          {viewMode === 'table' && (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <MaintenanceTable
                  tasks={tasks}
                  onTaskClick={setSelectedTask}
                  onTabChange={(tab) => console.log(`Tab changed to: ${tab}`)}
                  onPOClick={setSelectedPO}
                  activeTab="tasks"
                  purchaseOrders={purchaseOrders}
                />
                <div className="mt-4">
                  <PaginationControls />
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'calendar' && (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-4">
                <MaintenanceCalendar
                  tasks={tasks}
                  onTaskClick={setSelectedTask}
                  onSelectTimeSlot={handleTimeSlotSelect}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions Card */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={activeActionTab === 'new' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveActionTab('new')}
                className={activeActionTab === 'new' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              >
                New Issue
              </Button>
              <Button
                variant={activeActionTab === 'pending' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveActionTab('pending')}
                className={activeActionTab === 'pending' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              >
                Pending Review
              </Button>
              <Button
                variant={activeActionTab === 'escalated' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveActionTab('escalated')}
                className={activeActionTab === 'escalated' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}
              >
                Escalated
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">This Week</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Open Issues</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Modals */}
      {isTaskModalOpen && (
        <MaintenanceTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {isPurchaseOrderModalOpen && (
        <PurchaseOrderModal
          isOpen={isPurchaseOrderModalOpen}
          onClose={() => setIsPurchaseOrderModalOpen(false)}
          onSubmit={handleCreatePO}
          vendors={mockVendors}
          maintenanceId="temp-id"
        />
      )}

      {selectedTask && (
        <MaintenanceTaskView
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      {selectedPO && (
        <PurchaseOrderView
          purchaseOrder={selectedPO}
          onClose={() => setSelectedPO(null)}
          vendor={mockVendors[0]} // Using first vendor as fallback
        />
      )}

      <ShareReportModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        reportUrl={shareUrl}
        reportTitle="Maintenance Report"
      />

      {/* Issue Report Modal */}
      <IssueReportModal
        key={isIssueReportModalOpen ? 'open' : 'closed'}
        isOpen={isIssueReportModalOpen}
        onClose={() => setIsIssueReportModalOpen(false)}
        onSuccess={() => {
          setIsIssueReportModalOpen(false);
          toast({
            title: "Success",
            description: "Issue report submitted successfully!",
          });
          // Optionally refresh tasks
          loadTasks();
        }}
        facilityId={selectedFacility}
        facilities={facilities}
        buildings={buildings}
        rooms={rooms}
        fields={fields}
      />
    </div>
  );
} 