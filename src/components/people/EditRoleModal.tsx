'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Shield, Building, Crown, Users } from 'lucide-react';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  } | null;
  onUserUpdated?: () => void;
  currentUserRole?: string;
}

interface EditRoleFormData {
  role: string;
  is_active: boolean;
  facility_id?: string;
}

export function EditRoleModal({ isOpen, onClose, user, onUserUpdated, currentUserRole }: EditRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [formData, setFormData] = useState<EditRoleFormData>({
    role: user?.role || '',
    is_active: user?.is_active || true
  });

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        is_active: user.is_active
      });
    }
  }, [user]);

  // Load facilities for assignment
  useState(() => {
    async function loadFacilities() {
      const supabase = createClient();
      const { data } = await supabase
        .from('facilities')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (data) {
        setFacilities(data);
      }
    }
    loadFacilities();
  });

  // Available roles based on current user's permissions
  const getAvailableRoles = () => {
    // Only master admins can change roles
    if (currentUserRole !== 'master_admin') {
      return []; // Sub-admins can't change roles
    }

    // Master admins can assign any role
    return [
      { 
        value: 'master_admin', 
        label: 'Master Admin', 
        description: 'Full platform access, can manage everything',
        icon: <Crown className="h-4 w-4" />
      },
      { 
        value: 'sub_admin', 
        label: 'Sub-Master Admin', 
        description: 'Organization owner, can invite staff members',
        icon: <Shield className="h-4 w-4" />
      },
      { 
        value: 'staff', 
        label: 'Staff Member', 
        description: 'Team member with limited permissions',
        icon: <Users className="h-4 w-4" />
      }
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Check if current user has permission to change roles
      if (currentUserRole !== 'master_admin') {
        throw new Error('Only master admins can change user roles');
      }

      // Prevent demoting the last master admin
      if (user.role === 'master_admin' && formData.role !== 'master_admin') {
        // Check if there are other master admins
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'master_admin')
          .eq('is_active', true);
        
        if (count && count <= 1) {
          throw new Error('Cannot demote the last active master admin');
        }
      }
      
      // Update user role and status
      const { error } = await supabase
        .from('users')
        .update({
          role: formData.role,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update facility assignment if provided and not "none"
      if (formData.facility_id && formData.facility_id !== 'none') {
        const { error: facilityError } = await supabase
          .from('user_facilities')
          .upsert({
            user_id: user.id,
            facility_id: formData.facility_id
          });

        if (facilityError) {
          console.error('Facility assignment error:', facilityError);
          // Don't throw, facility assignment is optional
        }
      }

      const roleLabel = formData.role === 'master_admin' ? 'Master Admin' :
                       formData.role === 'sub_admin' ? 'Sub-Master Admin' : 'Staff';
      
      toast.success(`${user.full_name} is now a ${roleLabel}`);
      onUserUpdated?.();
      onClose();

    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = getAvailableRoles();
  const canEditRole = currentUserRole === 'master_admin';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            {canEditRole 
              ? `Update role and access level for ${user?.full_name}`
              : `Update settings for ${user?.full_name}`
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Current User Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Current User Details</p>
              <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Current Role: {user?.role === 'master_admin' ? 'Master Admin' :
                              user?.role === 'sub_admin' ? 'Sub-Master Admin' :
                              user?.role === 'staff' ? 'Staff' : user?.role}
              </p>
            </div>

            {/* Role - Only shown to master admins */}
            {canEditRole && (
              <div>
                <Label htmlFor="role">
                  <Shield className="inline h-3 w-3 mr-1" />
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {role.icon}
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-muted-foreground">{role.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.role === 'sub_admin' && user?.role !== 'sub_admin' && (
                  <p className="text-sm text-primary mt-2">
                    ⚡ Promoting to Sub-Master Admin will grant organization management capabilities
                  </p>
                )}
              </div>
            )}

            {/* Facility Assignment - Only for staff */}
            {facilities.length > 0 && formData.role === 'staff' && (
              <div>
                <Label htmlFor="facility">
                  <Building className="inline h-3 w-3 mr-1" />
                  Assign to Facility (Optional)
                </Label>
                <Select
                  value={formData.facility_id}
                  onValueChange={(value) => setFormData({ ...formData, facility_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No facility assignment</SelectItem>
                    {facilities.map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Account Status</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive accounts cannot access the system
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 