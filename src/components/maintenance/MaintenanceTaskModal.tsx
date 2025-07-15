'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, Building2, Users, Mail, Phone } from 'lucide-react';
import type { MaintenanceTask } from '@/types/maintenance';
import { createMaintenanceTask, getAvailableStaff, type CreateMaintenanceTaskData } from '@/app/actions/maintenance';
import { getAllFacilities } from '@/app/actions/facilities';
import { getBuildings } from '@/app/actions/buildings';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MaintenanceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<MaintenanceTask>) => void;
  initialData?: Partial<MaintenanceTask>;
}

interface InternalAssignment {
  userId: string;
  role: 'assignee' | 'observer' | 'approver';
}

interface ExternalAssignment {
  email: string;
  phone?: string;
  company_name?: string;
  role: 'contractor' | 'vendor' | 'consultant';
}

export default function MaintenanceTaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: MaintenanceTaskModalProps) {
  const [formData, setFormData] = useState<CreateMaintenanceTaskData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: (initialData?.type === 'preventive' || initialData?.type === 'corrective') ? initialData.type : 'corrective',
    priority: initialData?.priority || 'medium',
    facilityId: initialData?.facilityId || '',
    buildingId: initialData?.buildingId,
    roomId: initialData?.roomId,
    location: initialData?.location,
    systemType: initialData?.systemType,
    issueType: initialData?.issueType,
    impact: initialData?.impact,
    severity: initialData?.severity,
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    estimatedDuration: initialData?.estimatedDuration || 60,
    notes: initialData?.notes,
  });

  const [assignmentType, setAssignmentType] = useState<'none' | 'internal' | 'external'>('none');
  const [internalAssignments, setInternalAssignments] = useState<InternalAssignment[]>([]);
  const [externalAssignments, setExternalAssignments] = useState<ExternalAssignment[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load facilities on mount
  useEffect(() => {
    loadFacilities();
  }, []);

  // Load buildings when facility changes
  useEffect(() => {
    if (formData.facilityId) {
      loadBuildings(formData.facilityId);
    }
  }, [formData.facilityId]);

  // Load available staff
  useEffect(() => {
    if (assignmentType === 'internal') {
      loadAvailableStaff();
    }
  }, [assignmentType]);

  const loadFacilities = async () => {
    try {
      const data = await getAllFacilities();
      setFacilities(data);
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const loadBuildings = async (facilityId: string) => {
    try {
      const data = await getBuildings();
      const filteredBuildings = data.filter(b => b.facility_id === facilityId);
      setBuildings(filteredBuildings);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      const data = await getAvailableStaff();
      setAvailableStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.facilityId) {
      toast.error('Please select a facility');
      return;
    }

    setIsLoading(true);

    try {
      const taskData: CreateMaintenanceTaskData = {
        ...formData,
        assignmentType: assignmentType === 'none' ? undefined : assignmentType,
        internalAssignments: assignmentType === 'internal' ? internalAssignments : undefined,
        externalAssignments: assignmentType === 'external' ? externalAssignments : undefined,
      };

      const result = await createMaintenanceTask(taskData);

      if (result.success) {
        toast.success('Maintenance task created successfully');
        onSubmit({ id: result.taskId } as MaintenanceTask);
        onClose();
      } else {
        toast.error(result.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInternalAssignment = () => {
    setInternalAssignments([...internalAssignments, { userId: '', role: 'assignee' }]);
  };

  const handleRemoveInternalAssignment = (index: number) => {
    setInternalAssignments(internalAssignments.filter((_, i) => i !== index));
  };

  const handleInternalAssignmentChange = (index: number, updates: Partial<InternalAssignment>) => {
    setInternalAssignments(internalAssignments.map((assignment, i) => 
      i === index ? { ...assignment, ...updates } : assignment
    ));
  };

  const handleAddExternalAssignment = () => {
    setExternalAssignments([...externalAssignments, { email: '', role: 'contractor' }]);
  };

  const handleRemoveExternalAssignment = (index: number) => {
    setExternalAssignments(externalAssignments.filter((_, i) => i !== index));
  };

  const handleExternalAssignmentChange = (index: number, updates: Partial<ExternalAssignment>) => {
    setExternalAssignments(externalAssignments.map((assignment, i) => 
      i === index ? { ...assignment, ...updates } : assignment
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Maintenance Task' : 'Create New Maintenance Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="facility">Facility</Label>
              <Select
                value={formData.facilityId}
                onValueChange={(value) => setFormData({ ...formData, facilityId: value, buildingId: undefined })}
              >
                <SelectTrigger id="facility">
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="building">Building (Optional)</Label>
              <Select
                value={formData.buildingId || ''}
                onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                disabled={!formData.facilityId}
              >
                <SelectTrigger id="building">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Room 201, Floor 2"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the maintenance task..."
                rows={4}
              />
            </div>
          </div>

          {/* Assignment Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Assignment</h3>
            
            <Tabs value={assignmentType} onValueChange={(value) => setAssignmentType(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="none">No Assignment</TabsTrigger>
                <TabsTrigger value="internal">Internal Staff</TabsTrigger>
                <TabsTrigger value="external">External Contractor</TabsTrigger>
              </TabsList>

              <TabsContent value="none" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Task will be created without assignment. You can assign it later.
                </p>
              </TabsContent>

              <TabsContent value="internal" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Assign task to internal staff members
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInternalAssignment}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                </div>

                {internalAssignments.map((assignment, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                    <div className="col-span-7">
                      <Label>Staff Member</Label>
                      <Select
                        value={assignment.userId}
                        onValueChange={(value) => handleInternalAssignmentChange(index, { userId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStaff.map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              {staff.name} ({staff.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-4">
                      <Label>Role</Label>
                      <Select
                        value={assignment.role}
                        onValueChange={(value) => handleInternalAssignmentChange(index, { role: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assignee">Assignee</SelectItem>
                          <SelectItem value="observer">Observer</SelectItem>
                          <SelectItem value="approver">Approver</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveInternalAssignment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="external" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Invite external contractors to work on this task
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddExternalAssignment}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Add Contractor
                  </Button>
                </div>

                {externalAssignments.map((assignment, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                    <div className="col-span-4">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={assignment.email}
                        onChange={(e) => handleExternalAssignmentChange(index, { email: e.target.value })}
                        placeholder="contractor@email.com"
                        required
                      />
                    </div>

                    <div className="col-span-3">
                      <Label>Phone (Optional)</Label>
                      <Input
                        type="tel"
                        value={assignment.phone || ''}
                        onChange={(e) => handleExternalAssignmentChange(index, { phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="col-span-4">
                      <Label>Company (Optional)</Label>
                      <Input
                        value={assignment.company_name || ''}
                        onChange={(e) => handleExternalAssignmentChange(index, { company_name: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>

                    <div className="col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExternalAssignment(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="col-span-12">
                      <Label>Role</Label>
                      <Select
                        value={assignment.role}
                        onValueChange={(value) => handleExternalAssignmentChange(index, { role: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="consultant">Consultant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : (initialData ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}  