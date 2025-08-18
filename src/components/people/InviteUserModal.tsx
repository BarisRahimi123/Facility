'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Mail, Shield, Building, Briefcase, Phone, User, Crown, MapPin } from 'lucide-react';
import { sendInvitationEmail } from '@/lib/email';
import { sendUserInvitation } from '@/app/actions/invitations';

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
  organization_id?: string;
  organization_name?: string;
  phone: string;
  sendEmail: boolean;
  customMessage: string;
  // Sub-master specific fields
  company_name?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_zip?: string;
}

export function InviteUserModal({ isOpen, onClose, currentUserRole, onInviteSent }: InviteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: '',
    fullName: '',
    department: '',
    position: '',
    phone: '',
    sendEmail: true,
    customMessage: '',
    company_name: '',
    company_address: '',
    company_city: '',
    company_state: '',
    company_zip: ''
  });

  // Determine the role being invited based on current user
  useEffect(() => {
    if (currentUserRole === 'master_admin') {
      setFormData(prev => ({ ...prev, role: 'sub_admin' }));
    } else if (currentUserRole === 'sub_admin') {
      setFormData(prev => ({ ...prev, role: 'staff' }));
    }
  }, [currentUserRole]);

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
    if (currentUserRole === 'sub_admin') {
      loadFacilities();
    }
  });

  // Load organizations when role is renter
  const loadOrganizations = async () => {
    if (formData.role === 'renter') {
      setLoadingOrganizations(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('organizations')
          .select('id, name, subtype')
          .eq('type', 'renter')
          .eq('is_active', true)
          .order('name');
        
        if (data) {
          setOrganizations(data);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    }
  };

  // Load organizations when role changes to renter
  useEffect(() => {
    loadOrganizations();
  }, [formData.role]);

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    if (currentUserRole === 'master_admin') {
      return [
        { value: 'sub_admin', label: 'Sub-Master Admin', description: 'Can manage their organization and invite staff members' }
      ];
    } else if (currentUserRole === 'sub_admin') {
      return [
        { value: 'staff', label: 'Staff Member', description: 'Team member with limited permissions within the organization' }
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      console.log('Sending invitation:', {
        email: formData.email,
        role: formData.role,
        invitedBy: user.id
      });

      // Prepare metadata based on role
      let metadata: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        customMessage: formData.customMessage
      };

      if (formData.role === 'sub_admin') {
        // Sub-master admin specific metadata
        metadata = {
          ...metadata,
          company_name: formData.company_name,
          company_address: formData.company_address,
          company_city: formData.company_city,
          company_state: formData.company_state,
          company_zip: formData.company_zip
        };
      } else if (formData.role === 'staff') {
        // Staff specific metadata
        metadata = {
          ...metadata,
          department: formData.department,
          position: formData.position
        };
      }

      // Call the server action to send invitation
      const result = await sendUserInvitation({
        email: formData.email,
        role: formData.role,
        facility_id: formData.facility_id && formData.facility_id !== 'none' ? formData.facility_id : null,
        organization_id: null,
        metadata: metadata
      });

      if (!result.success) {
        console.error('Invitation error:', result.error);
        
        // Check for specific error types
        const errorMessage = result.error || 'Failed to send invitation';
        
        if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
          throw new Error(
            'The invitation system is not properly configured. ' +
            'Please apply the fix in Supabase SQL Editor: scripts/quick-fix-invitation-roles.sql'
          );
        } else if (errorMessage.includes('already exists')) {
          throw new Error('A user with this email address already exists');
        } else if (errorMessage.includes('already been sent')) {
          throw new Error('An invitation has already been sent to this email address');
        } else if (errorMessage.includes('permission')) {
          throw new Error('You do not have permission to invite this type of user. Please apply the role fix in Supabase.');
        } else if (errorMessage.includes('ambiguous')) {
          throw new Error(
            'Database configuration error. Please apply the fix: ' +
            'Go to Supabase SQL Editor and run the contents of scripts/quick-fix-invitation-roles.sql'
          );
        }
        
        throw new Error(errorMessage);
      }

      const data = result.data;

      console.log('Invitation sent successfully:', data);

      // Send email notification if enabled
      if (formData.sendEmail && data) {
        try {
          await sendInvitationEmailNotification(data);
          console.log('Email notification sent');
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the whole operation if email fails
          toast.warning('Invitation created but email notification failed');
        }
      }

      toast.success(`Invitation sent to ${formData.email}`);
      onInviteSent?.();
      onClose();
      resetForm();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setLoading(false);
      toast.error(error.message || 'Failed to send invitation');
    }
  };

  const sendInvitationEmailNotification = async (invitationData: any) => {
    const result = await sendInvitationEmail(invitationData);
    if (!result.success) {
      console.error('Failed to send invitation email:', result.error);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      role: currentUserRole === 'master_admin' ? 'sub_admin' : 'staff',
      fullName: '',
      department: '',
      position: '',
      phone: '',
      sendEmail: true,
      customMessage: '',
      company_name: '',
      company_address: '',
      company_city: '',
      company_state: '',
      company_zip: ''
    });
  };

  const availableRoles = getAvailableRoles();
  const isInvitingSubMaster = formData.role === 'sub_admin';
  const isInvitingStaff = formData.role === 'staff';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isInvitingSubMaster ? (
              <>
                <Crown className="h-5 w-5 text-primary" />
                Invite Sub-Master Admin
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" />
                Invite Staff Member
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isInvitingSubMaster 
              ? 'Invite a new Sub-Master Admin who will manage their own organization'
              : 'Invite a new staff member to join your organization'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Basic Information
            </h3>
            
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
                <Label htmlFor="fullName">
                  <User className="inline h-3 w-3 mr-1" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">
                  <Phone className="inline h-3 w-3 mr-1" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sub-Master Admin Specific Fields */}
          {isInvitingSubMaster && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Organization Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="company_name">
                    <Building className="inline h-3 w-3 mr-1" />
                    Organization Name *
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                    placeholder="ABC Company Inc."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be the organization they manage
                  </p>
                </div>

                {/* Company Address */}
                <div className="md:col-span-2">
                  <Label htmlFor="company_address">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    Organization Address
                  </Label>
                  <Input
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                {/* City */}
                <div>
                  <Label htmlFor="company_city">City</Label>
                  <Input
                    id="company_city"
                    value={formData.company_city}
                    onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                    placeholder="San Francisco"
                  />
                </div>

                {/* State */}
                <div>
                  <Label htmlFor="company_state">State</Label>
                  <Input
                    id="company_state"
                    value={formData.company_state}
                    onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                {/* Zip */}
                <div>
                  <Label htmlFor="company_zip">ZIP Code</Label>
                  <Input
                    id="company_zip"
                    value={formData.company_zip}
                    onChange={(e) => setFormData({ ...formData, company_zip: e.target.value })}
                    placeholder="94105"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Staff Specific Fields */}
          {isInvitingStaff && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Work Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Facility Coordinator"
                  />
                </div>

                {/* Facility Assignment */}
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
              </div>
            </div>
          )}

          {/* Custom Message - Always shown */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Invitation Message
            </h3>
            
            <div>
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                placeholder={
                  isInvitingSubMaster 
                    ? "Welcome to our platform! We're excited to have your organization join us..."
                    : "Welcome to our team! We're looking forward to working with you..."
                }
                rows={3}
              />
            </div>

            {/* Send Email Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
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

          <div className="flex justify-end gap-3 border-t pt-6">
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