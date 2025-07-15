'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Settings, Trash2 } from 'lucide-react';
import {
  createRoomAssignment,
  deleteRoomAssignment,
  getAvailableUsers,
  getStaffRoomAssignments
} from '@/app/actions/staff';
import type {
  AssignmentUser,
  StaffRole,
  StaffPermissions,
  StaffRoomAssignment
} from '@/types/staff';

interface AssignStaffToRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomNumber: string;
  buildingName: string;
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

export default function AssignStaffToRoomModal({
  isOpen,
  onClose,
  roomId,
  roomNumber,
  buildingName,
  facilityName,
  onAssignmentChange
}: AssignStaffToRoomModalProps) {
  const [users, setUsers] = useState<AssignmentUser[]>([]);
  const [assignments, setAssignments] = useState<StaffRoomAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('staff');
  const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, roomId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Load available users and current assignments in parallel
      const [usersResponse, assignmentsResponse] = await Promise.all([
        getAvailableUsers(),
        getStaffRoomAssignments()
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
        // Filter assignments for this specific room
        const roomAssignments = assignmentsResponse.data?.filter(
          assignment => assignment.room_id === roomId
        ) || [];
        setAssignments(roomAssignments);
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
        description: "You must select a user to assign to this room",
        variant: "destructive"
      });
      return;
    }

    // Check if user is already assigned
    const existingAssignment = assignments.find(a => a.user_id === selectedUserId);
    if (existingAssignment) {
      toast({
        title: "User already assigned",
        description: "This user is already assigned to this room",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await createRoomAssignment({
        user_id: selectedUserId,
        room_id: roomId,
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
        description: `User has been assigned to room ${roomNumber}`,
      });

      // Reset form and reload data
      setSelectedUserId('');
      setSelectedRole('staff');
      setPermissions(DEFAULT_PERMISSIONS);
      await loadData();
      onAssignmentChange?.();
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

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const response = await deleteRoomAssignment(assignmentId);

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
        description: "Staff assignment has been removed successfully",
      });

      await loadData();
      onAssignmentChange?.();
    } catch (error) {
      toast({
        title: "Error removing assignment",
        description: "Failed to remove staff assignment",
        variant: "destructive"
      });
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
            Assign Staff to Room
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <div>Room: <span className="font-medium">{roomNumber}</span></div>
            <div>Building: <span className="font-medium">{buildingName}</span></div>
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
            <div>
              <h3 className="font-medium mb-3">Current Assignments</h3>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No staff currently assigned to this room
                </p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((assignment) => {
                    const user = getAssignedUser(assignment.user_id);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{user?.email || 'Unknown User'}</div>
                            {user?.full_name && (
                              <div className="text-sm text-muted-foreground">{user.full_name}</div>
                            )}
                          </div>
                          <Badge className={getRoleColor(assignment.role)}>
                            {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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
    </Dialog>
  );
}  