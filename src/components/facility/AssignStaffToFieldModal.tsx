'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Settings, Trash2 } from 'lucide-react';
import {
  createFieldAssignment,
  deleteFieldAssignment,
  getFieldStaffAssignments
} from '@/app/actions/staff';
import type {
  AssignmentUser,
  StaffRole,
  StaffPermissions,
  StaffFieldAssignment
} from '@/types/staff';

interface AssignStaffToFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: string;
  fieldName: string;
  facilityName: string;
  onAssignmentChange?: () => void;
}

const DEFAULT_PERMISSIONS: StaffPermissions = {
  manage_calendar: true,
  create_blockouts: true,
  view_reservations: true,
  manage_reservations: false,
  view_reports: true,
};

export default function AssignStaffToFieldModal({
  isOpen,
  onClose,
  fieldId,
  fieldName,
  facilityName,
  onAssignmentChange
}: AssignStaffToFieldModalProps) {
  const [users, setUsers] = useState<AssignmentUser[]>([]);
  const [assignments, setAssignments] = useState<StaffFieldAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('staff');
  const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [removeConfirm, setRemoveConfirm] = useState<{ assignmentId: string; userName: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, fieldId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Load available users via API and current assignments in parallel
      const [usersResponse, assignmentsResponse] = await Promise.all([
        fetch('/api/users/available').then(res => res.json()),
        getFieldStaffAssignments(fieldId)
      ]);

      if (usersResponse.error) {
        toast({
          title: "Error loading users",
          description: usersResponse.error,
          variant: "destructive"
        });
      } else {
        setUsers(usersResponse.data || []);
      }

      if (assignmentsResponse.error) {
        toast({
          title: "Error loading assignments",
          description: assignmentsResponse.error,
          variant: "destructive"
        });
      } else {
        // Now we get assignments directly for this field, no need to filter
        setAssignments(assignmentsResponse.data || []);
      }
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load users and assignments",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedUserId) {
      toast({
        title: "Please select a user",
        description: "You must select a user to assign to this field",
        variant: "destructive"
      });
      return;
    }

    // Check if user is already assigned
    const existingAssignment = assignments.find(a => a.user_id === selectedUserId);
    if (existingAssignment) {
      toast({
        title: "User already assigned",
        description: "This user is already assigned to this field",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await createFieldAssignment({
        user_id: selectedUserId,
        field_id: fieldId,
        role: selectedRole,
        permissions
      });

      if (response.error) {
        toast({
          title: "Error creating assignment",
          description: response.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Staff assigned successfully",
        description: `User has been assigned to ${fieldName}`,
      });

      // Reset form and reload data
      setSelectedUserId('');
      setSelectedRole('staff');
      setPermissions(DEFAULT_PERMISSIONS);
      await loadData();
      onAssignmentChange?.();
      onClose(); // Close the modal after successful assignment
    } catch (error) {
      toast({
        title: "Error assigning staff",
        description: "Failed to create staff assignment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = (assignmentId: string, userName: string) => {
    setRemoveConfirm({ assignmentId, userName });
  };

  const confirmDeleteAssignment = async () => {
    if (!removeConfirm) return;

    try {
      const response = await deleteFieldAssignment(removeConfirm.assignmentId);

      if (response.error) {
        toast({
          title: "Error removing assignment",
          description: response.error,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Assignment removed",
        description: `${removeConfirm.userName} has been removed from this field`,
      });

      await loadData();
      onAssignmentChange?.();
    } catch (error) {
      toast({
        title: "Error removing assignment",
        description: "Failed to remove staff assignment",
        variant: "destructive"
      });
    } finally {
      setRemoveConfirm(null);
    }
  };

  const handlePermissionChange = (permission: keyof StaffPermissions, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const getRoleColor = (role: StaffRole) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'coordinator': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAssignedUser = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Staff to Field
          </DialogTitle>
          <DialogDescription>
            Manage staff assignments and permissions for this field.
          </DialogDescription>
          <div className="text-sm text-muted-foreground mt-2">
            <div>Field: <span className="font-medium">{fieldName}</span></div>
            <div>Facility: <span className="font-medium">{facilityName}</span></div>
          </div>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Assignments */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Current Assignments
                <Badge variant="secondary" className="ml-2">
                  {assignments.length}
                </Badge>
              </h3>
              {assignments.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No staff currently assigned to this field</p>
                  <p className="text-xs text-muted-foreground mt-1">Use the form below to assign staff members</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const user = getAssignedUser(assignment.user_id);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{user?.email || 'Unknown User'}</div>
                            {user?.full_name && (
                              <div className="text-sm text-gray-500">{user.full_name}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              Assigned on {new Date(assignment.assigned_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleColor(assignment.role)}>
                              {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)}
                            </Badge>
                          </div>
                        </div>
                                                  <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id, user?.email || user?.full_name || 'Unknown User')}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                            title="Remove assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove assignment</span>
                          </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Assignment */}
            <div className="border-t pt-6">
              <h3 className="font-medium mb-4">Add New Assignment</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select User</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(user => !assignments.some(a => a.user_id === user.id))
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div>
                              <div>{user.email}</div>
                              {user.full_name && (
                                <div className="text-xs text-muted-foreground">{user.full_name}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={selectedRole} onValueChange={(value: StaffRole) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(key as keyof StaffPermissions, checked as boolean)
                        }
                      />
                      <label htmlFor={key} className="text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleAssignStaff} disabled={loading || !selectedUserId}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Assign Staff
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeConfirm?.userName}</strong> from this field? 
              This action cannot be undone and they will lose access to manage this field.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAssignment}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
} 