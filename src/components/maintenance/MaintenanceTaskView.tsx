'use client';

import { useState, useEffect, useMemo } from 'react';
import type { MaintenanceTask } from '@/types/maintenance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Share2, Mail, MessageSquare, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getContractors } from '@/lib/db/contractors';
import { updateTask, createRFQ } from '@/lib/db/tasks';
import { getUsers } from '@/services/users';
import type { User } from '@/types/user';

// Remove mock data since we're now fetching from the API
interface MaintenanceTaskViewProps {
  task: MaintenanceTask;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<MaintenanceTask>) => void;
}

interface ContractorFormData {
  name: string;
  email: string;
  phone: string;
  type: string;
  specialties: string[];
  rating: number;
  completedJobs: number;
  responseTime: string;
  availability: 'Available' | 'Busy' | 'Unavailable';
  lastHired: string;
}

interface ContractorData extends ContractorFormData {
  id: string;
}

export default function MaintenanceTaskView({
  task,
  onClose,
  onUpdate,
}: MaintenanceTaskViewProps) {
  const [assignmentType, setAssignmentType] = useState<'internal' | 'contractor'>(
    task.assignmentType || 'internal'
  );
  const [selectedAssignee, setSelectedAssignee] = useState(task.assignedTo || '');
  const [contractors, setContractors] = useState<ContractorData[]>([]);
  const [internalStaff, setInternalStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load staff and contractors when component mounts
  useEffect(() => {
    let isMounted = true; // Add a flag to prevent state updates after unmount
    
    async function loadData() {
      if (!assignmentType) return;
      
      setIsLoading(true);
      
      try {
        if (assignmentType === 'internal') {
          const users = await getUsers();
          const staff = users.filter(user => 
            user.type === 'internal' && 
            (user.role === 'staff' || user.role === 'admin')
          );
          
          // Only update state if component is still mounted
          if (isMounted) {
            setInternalStaff(staff);
            setContractors([]); // Clear contractors when switching to internal
          }
        } else {
          const data = await getContractors();
          
          // Only update state if component is still mounted
          if (isMounted && Array.isArray(data)) {
            setContractors(data);
            setInternalStaff([]); // Clear internal staff when switching to contractor
          } else if (isMounted) {
            throw new Error('Invalid data format received from contractors API');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        
        // Only show toast if component is still mounted
        if (isMounted) {
          toast({
            title: "Error",
            description: `Failed to load ${assignmentType === 'internal' ? 'staff' : 'contractors'}. Please try again.`,
            variant: "destructive",
          });
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [assignmentType, toast]);

  // Filter staff based on role and department
  const filteredStaff = useMemo(() => {
    return internalStaff.filter(staff => {
      if (task.systemType) {
        // Match staff with relevant skills/department
        const skill = task.systemType.toLowerCase();
        return (
          staff.skills?.some(s => s.toLowerCase().includes(skill)) ||
          staff.department?.toLowerCase().includes('maintenance') ||
          staff.department?.toLowerCase().includes('facilities')
        );
      }
      return true;
    });
  }, [internalStaff, task.systemType]);

  // Filter contractors based on task type and specialties
  const filteredContractors = useMemo(() => {
    const filtered = contractors
      .filter(contractor => {
        if (task.systemType) {
          return contractor.specialties.some(specialty => 
            specialty.toLowerCase().includes(task.systemType?.toLowerCase() || '')
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.availability !== b.availability) {
          return a.availability === 'Available' ? -1 : 1;
        }
        return b.rating - a.rating;
      });
    console.log('Filtered contractors:', filtered);
    return filtered;
  }, [contractors, task.systemType]);

  const handleTaskUpdate = async () => {
    try {
      if (!selectedAssignee) {
        toast({
          title: "Error",
          description: "Please select an assignee",
          variant: "destructive",
        });
        return;
      }

      if (assignmentType === 'contractor') {
        const selectedContractor = contractors.find(c => c.id === selectedAssignee);
        if (!selectedContractor) {
          toast({
            title: "Error",
            description: "Selected contractor not found",
            variant: "destructive",
          });
          return;
        }

        // Generate unique submission ID for this contractor
        const submissionId = `${task.id}-${selectedContractor.id}-${Date.now()}`;

        // Generate the estimate form URL with submission ID
        const formUrl = `${window.location.origin}/contractor-form/${task.id}?sid=${submissionId}`;

        // Create a new RFQ with submission ID
        const rfq = await createRFQ(task.id, {
          title: `RFQ for ${task.title}`,
          description: task.description,
          scope: task.description,
          status: 'sent',
          vendorIds: [selectedContractor.id],
          submissionIds: { [selectedContractor.id]: submissionId },
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        });

        // Update task with assignment and workflow status
        const updates: Partial<MaintenanceTask> = {
          assignmentType,
          assignedTo: selectedAssignee,
          status: 'pending',
          workflowStatus: 'pending_estimate',
          requestForQuotes: [...(task.requestForQuotes || []), rfq],
        };

        // Update the task in the database
        const updatedTask = await updateTask(task.id, updates);

        // Send email to contractor with the form URL
        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: selectedContractor.email,
            taskId: task.id,
            contractorName: selectedContractor.name,
            taskTitle: task.title,
            taskDescription: task.description,
            systemType: task.systemType,
            location: task.location,
            formUrl: formUrl
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.error || 'Failed to send email');
        }

        // Only call onUpdate after successful API update
        if (onUpdate) {
          onUpdate(task.id, updatedTask);
        }

        toast({
          title: "Success",
          description: "Contractor assigned and RFQ sent successfully",
        });
      } else {
        // Handle internal assignment
        const updates: Partial<MaintenanceTask> = {
          assignmentType,
          assignedTo: selectedAssignee,
          status: 'in_progress',
          workflowStatus: 'in_progress',
        };

        // Update the task in the database
        const updatedTask = await updateTask(task.id, updates);

        if (onUpdate) {
          onUpdate(task.id, updatedTask);
        }

        toast({
          title: "Success",
          description: "Task assigned successfully",
        });
      }

      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleShare = (method: 'email' | 'sms' | 'copy') => {
    // Generate a unique token
    const token = Math.random().toString(36).substring(7);
    
    // Create the shareable URL
    const baseUrl = window.location.origin;
    const url = new URL(`${baseUrl}/report/${token}`);
    
    // Add task details as parameters
    if (task.systemType) url.searchParams.set('system', task.systemType);
    if (task.location) url.searchParams.set('location', task.location);
    if (task.issueType) url.searchParams.set('issue', task.issueType);
    if (task.description) url.searchParams.set('description', task.description);
    
    const shareableUrl = url.toString();

    switch (method) {
      case 'email':
        const subject = `Maintenance Issue: ${task.title}`;
        const body = `Please review this maintenance issue: ${shareableUrl}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        toast({
          title: "Email client opened",
          description: "Share the issue via your email client",
        });
        break;

      case 'sms':
        // Open SMS sharing modal or handle SMS sharing
        window.location.href = `sms:?body=${encodeURIComponent(`Please review this maintenance issue: ${shareableUrl}`)}`;
        toast({
          title: "SMS opened",
          description: "Share the issue via SMS",
        });
        break;

      case 'copy':
        navigator.clipboard.writeText(shareableUrl)
          .then(() => {
            toast({
              title: "Link copied!",
              description: "The shareable link has been copied to your clipboard.",
            });
          })
          .catch((err) => {
            console.error('Failed to copy link:', err);
            toast({
              title: "Failed to copy",
              description: "Please copy the link manually: " + shareableUrl,
              variant: "destructive",
            });
          });
        break;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{task.title}</span>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Issue Form
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <DropdownMenuItem onClick={() => handleShare('email')} className="flex-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Share via Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('sms')} className="flex-1">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Share via SMS
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuItem onClick={() => handleShare('copy')}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Issue Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Issue Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>System Type</Label>
                <p className="text-sm text-gray-600">{task.systemType}</p>
              </div>
              <div>
                <Label>Location</Label>
                <p className="text-sm text-gray-600">{task.location}</p>
              </div>
              <div>
                <Label>Issue Type</Label>
                <p className="text-sm text-gray-600">{task.issueType}</p>
              </div>
              <div>
                <Label>Priority</Label>
                <p className="text-sm text-gray-600">{task.priority}</p>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assignment</h3>
            <div className="space-y-4">
              <div>
                <Label>Assignment Type</Label>
                <div className="flex gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('internal');
                      setSelectedAssignee('');
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      assignmentType === 'internal'
                        ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    Internal Team
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentType('contractor');
                      setSelectedAssignee('');
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      assignmentType === 'contractor'
                        ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    External Contractor
                  </button>
                </div>
              </div>

              {assignmentType && (
                <div>
                  <Label>{assignmentType === 'internal' ? 'Team Member' : 'Contractor'}</Label>
                  <Select
                    value={selectedAssignee}
                    onValueChange={setSelectedAssignee}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full bg-white border border-input">
                      <SelectValue 
                        placeholder={
                          isLoading 
                            ? "Loading..." 
                            : `Select ${assignmentType === 'internal' ? 'team member' : 'contractor'}`
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {assignmentType === 'internal' ? (
                        isLoading ? (
                          <div className="p-2 text-sm text-gray-500">Loading team members...</div>
                        ) : filteredStaff.length > 0 ? (
                          filteredStaff.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id} className="cursor-pointer hover:bg-gray-100">
                              <div className="flex flex-col py-1">
                                <span className="font-medium">{staff.name}</span>
                                <span className="text-sm text-gray-500">
                                  {staff.role} - {staff.department}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">No team members available</div>
                        )
                      ) : (
                        isLoading ? (
                          <div className="p-2 text-sm text-gray-500">Loading contractors...</div>
                        ) : filteredContractors.length > 0 ? (
                          filteredContractors.map((contractor) => (
                            <SelectItem key={contractor.id} value={contractor.id} className="cursor-pointer hover:bg-gray-100">
                              <div className="flex flex-col py-1">
                                <span className="font-medium">{contractor.name}</span>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>{contractor.type}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    contractor.availability === 'Available' 
                                      ? 'bg-green-100 text-green-800'
                                      : contractor.availability === 'Busy'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {contractor.availability}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">No contractors available</div>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleTaskUpdate}
                  disabled={!assignmentType || !selectedAssignee || isLoading}
                >
                  {isLoading ? 'Loading...' : 'Assign Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 