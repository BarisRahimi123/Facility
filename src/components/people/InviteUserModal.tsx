'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { UserPlus, Mail, Shield, Building, Briefcase } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  onInviteSent?: () => void;
}

interface InviteFormData {
  email: string;
  role: string;
  fullName: string;
  department: string;
  position: string;
  facility_id?: string;
  sendEmail: boolean;
  customMessage: string;
}

export function InviteUserModal({ isOpen, onClose, currentUserRole, onInviteSent }: InviteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: '',
    fullName: '',
    department: '',
    position: '',
    sendEmail: true,
    customMessage: ''
  });

  // Load facilities for assignment
  useState(() => {
    async function loadFacilities() {
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

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUserRole === 'master_admin') {
      return [
        { value: 'sub_master', label: 'Sub-Master Admin', description: 'Can manage facilities and invite staff' },
        { value: 'manager', label: 'Manager', description: 'Facility management with approval authority' },
        { value: 'coordinator', label: 'Coordinator', description: 'Coordinate facility operations' },
        { value: 'staff', label: 'Staff', description: 'General facility staff member' },
        { value: 'maintenance', label: 'Maintenance', description: 'Maintenance team member' },
        { value: 'vendor', label: 'Vendor', description: 'External vendor or contractor' }
      ];
    } else if (currentUserRole === 'sub_master') {
      return [
        { value: 'manager', label: 'Manager', description: 'Facility management with approval authority' },
        { value: 'coordinator', label: 'Coordinator', description: 'Coordinate facility operations' },
        { value: 'staff', label: 'Staff', description: 'General facility staff member' },
        { value: 'maintenance', label: 'Maintenance', description: 'Maintenance team member' },
        { value: 'vendor', label: 'Vendor', description: 'External vendor or contractor' }
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function to send invitation
      const { data, error } = await supabase.rpc('send_user_invitation', {
        p_email: formData.email,
        p_role: formData.role,
        p_invited_by: user.id,
        p_facility_id: formData.facility_id || null,
        p_metadata: {
          fullName: formData.fullName,
          department: formData.department,
          position: formData.position,
          customMessage: formData.customMessage
        }
      });

      if (error) throw error;

      // Send email notification if enabled
      if (formData.sendEmail && data) {
        await sendInvitationEmail(data);
      }

      toast.success(`Invitation sent to ${formData.email}`);
      onInviteSent?.();
      onClose();
      resetForm();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitationEmail = async (invitationData: any) => {
    // This would integrate with your email service
    // For now, we'll just log the invitation details
    console.log('Would send email with invitation:', invitationData);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      role: '',
      fullName: '',
      department: '',
      position: '',
      sendEmail: true,
      customMessage: ''
    });
  };

  const availableRoles = getAvailableRoles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Send an invitation to add a new user to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="md:col-span-2">
              <Label htmlFor="email">
                <Mail className="inline h-3 w-3 mr-1" />
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="user@example.com"
              />
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>

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

            {/* Department */}
            <div>
              <Label htmlFor="department">
                <Briefcase className="inline h-3 w-3 mr-1" />
                Department
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Operations"
              />
            </div>

            {/* Position */}
            <div>
              <Label htmlFor="position">Position/Title</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Facility Manager"
              />
            </div>

            {/* Facility Assignment (optional) */}
            {facilities.length > 0 && (
              <div className="md:col-span-2">
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
                    <SelectItem value="">No facility assignment</SelectItem>
                    {facilities.map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Message */}
            <div className="md:col-span-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                placeholder="Add a personal welcome message to include in the invitation email..."
                rows={3}
              />
            </div>

            {/* Send Email Toggle */}
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Send Email Invitation</Label>
                <p className="text-sm text-muted-foreground">
                  Send an email with instructions to complete account setup
                </p>
              </div>
              <Switch
                checked={formData.sendEmail}
                onCheckedChange={(checked) => setFormData({ ...formData, sendEmail: checked })}
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
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 