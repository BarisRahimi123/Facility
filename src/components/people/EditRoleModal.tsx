'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Shield, Building } from 'lucide-react';

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
}

interface EditRoleFormData {
  role: string;
  is_active: boolean;
  facility_id?: string;
}

export function EditRoleModal({ isOpen, onClose, user, onUserUpdated }: EditRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [formData, setFormData] = useState<EditRoleFormData>({
    role: user?.role || '',
    is_active: user?.is_active || true
  });

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

  // Available roles for different user types
  const getAvailableRoles = () => {
    return [
      { value: 'master_admin', label: 'Master Admin', description: 'Full system access and user management' },
      { value: 'sub_master', label: 'Sub-Master Admin', description: 'Can manage facilities and invite staff' },
      { value: 'district_approver', label: 'District Approver', description: 'District-wide approval authority' },
      { value: 'site_approver', label: 'Site Approver', description: 'Site-level approval authority' },
      { value: 'manager', label: 'Manager', description: 'Facility management with approval authority' },
      { value: 'coordinator', label: 'Coordinator', description: 'Coordinate facility operations' },
      { value: 'staff', label: 'Staff', description: 'General facility staff member' },
      { value: 'maintenance', label: 'Maintenance', description: 'Maintenance team member' },
      { value: 'vendor', label: 'Vendor', description: 'External vendor or contractor' },
      { value: 'renter', label: 'Renter', description: 'Can book/rent facilities' }
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
      const supabase = createClient();
      
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

        if (facilityError) throw facilityError;
      }

      toast.success(`Updated role for ${user.full_name}`);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Edit User Role
          </DialogTitle>
          <DialogDescription>
            Update role and access level for {user?.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {/* Role */}
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
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Facility Assignment (optional) */}
            {facilities.length > 0 && (
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
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 