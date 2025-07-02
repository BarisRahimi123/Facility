'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// Note: Using custom checkbox implementation since @/components/ui/checkbox doesn't exist
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Copy, Users, Shield, Building2, X, Plus } from 'lucide-react';
import { Facility } from '@/types/facility';

interface ShareFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility?: Facility | null; // null means share all facilities
  onShare: (shareData: ShareRequest) => void;
}

interface ShareRequest {
  facilityIds: string[]; // empty array means all facilities
  inviteeEmail: string;
  inviteeName: string;
  role: 'consultant' | 'vendor' | 'external';
  company: string;
  message: string;
  permissions: {
    viewPlans: boolean;
    viewTasks: boolean;
    viewDocuments: boolean;
    viewMaintenance: boolean;
    viewReports: boolean;
    addComments: boolean;
  };
  expiresAt?: Date;
}

const defaultPermissions = {
  viewPlans: true,
  viewTasks: true,
  viewDocuments: true,
  viewMaintenance: true,
  viewReports: true,
  addComments: false,
};

export default function ShareFacilityModal({ isOpen, onClose, facility, onShare }: ShareFacilityModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<{
    inviteeEmail: string;
    inviteeName: string;
    role: 'consultant' | 'vendor' | 'external';
    company: string;
    message: string;
    permissions: typeof defaultPermissions;
    expirationDays: string;
  }>({
    inviteeEmail: '',
    inviteeName: '',
    role: 'consultant',
    company: '',
    message: '',
    permissions: { ...defaultPermissions },
    expirationDays: '30',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedPermissions, setShowAdvancedPermissions] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        inviteeEmail: '',
        inviteeName: '',
        role: 'consultant',
        company: '',
        message: facility 
          ? `You've been invited to access information for ${facility.name}.`
          : "You've been invited to access facility information.",
        permissions: { ...defaultPermissions },
        expirationDays: '30',
      });
      setShowAdvancedPermissions(false);
    }
  }, [isOpen, facility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      if (!formData.inviteeEmail || !formData.inviteeName) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expirationDays));

      const shareRequest: ShareRequest = {
        facilityIds: facility ? [facility.id] : [], // empty means all facilities
        inviteeEmail: formData.inviteeEmail,
        inviteeName: formData.inviteeName,
        role: formData.role,
        company: formData.company,
        message: formData.message,
        permissions: formData.permissions,
        expiresAt,
      };

      await onShare(shareRequest);
      
      toast({
        title: 'Invitation Sent',
        description: `Invitation has been sent to ${formData.inviteeEmail}`,
      });

      onClose();
    } catch (error) {
      console.error('Error sharing facility:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permission: keyof typeof defaultPermissions, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked,
      },
    }));
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/invite/facility/${facility?.id || 'all'}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Link Copied',
      description: 'Invitation link has been copied to clipboard.',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-purple-400" />
            Share {facility ? facility.name : 'All Facilities'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Invite consultants and external users to access facility information with controlled permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Share Scope Indicator */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-purple-400" />
              <span className="font-medium text-white">Share Scope</span>
            </div>
            <Badge variant="outline" className="border-purple-500 text-purple-300">
              {facility ? `Single Facility: ${facility.name}` : 'All Facilities'}
            </Badge>
          </div>

          {/* Invitee Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Invitee Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inviteeName" className="text-gray-300">Full Name *</Label>
                <Input
                  id="inviteeName"
                  value={formData.inviteeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteeName: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="inviteeEmail" className="text-gray-300">Email Address *</Label>
                <Input
                  id="inviteeEmail"
                  type="email"
                  value={formData.inviteeEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteeEmail: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role" className="text-gray-300">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'consultant' | 'vendor' | 'external') => 
                    setFormData(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="external">External Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="company" className="text-gray-300">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Company Name"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Access Permissions</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedPermissions(!showAdvancedPermissions)}
                className="text-purple-400 hover:text-purple-300"
              >
                {showAdvancedPermissions ? 'Simple' : 'Advanced'}
              </Button>
            </div>

            {!showAdvancedPermissions ? (
              // Simple Permission Presets
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">View Only Access</h4>
                      <p className="text-sm text-gray-400">Can view all information but cannot edit or comment</p>
                    </div>
                    <Badge className="bg-green-600 text-white">Recommended</Badge>
                  </div>
                </div>
              </div>
            ) : (
              // Advanced Permissions
              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="viewPlans"
                       checked={formData.permissions.viewPlans}
                       onChange={(e) => handlePermissionChange('viewPlans', e.target.checked)}
                       className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                     />
                     <Label htmlFor="viewPlans" className="text-sm text-gray-300">View Plans</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="viewTasks"
                       checked={formData.permissions.viewTasks}
                       onChange={(e) => handlePermissionChange('viewTasks', e.target.checked)}
                       className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                     />
                     <Label htmlFor="viewTasks" className="text-sm text-gray-300">View Tasks</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="viewDocuments"
                       checked={formData.permissions.viewDocuments}
                       onChange={(e) => handlePermissionChange('viewDocuments', e.target.checked)}
                       className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                     />
                     <Label htmlFor="viewDocuments" className="text-sm text-gray-300">View Documents</Label>
                   </div>
                 </div>

                 <div className="space-y-3">
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="viewMaintenance"
                       checked={formData.permissions.viewMaintenance}
                       onChange={(e) => handlePermissionChange('viewMaintenance', e.target.checked)}
                       className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                     />
                     <Label htmlFor="viewMaintenance" className="text-sm text-gray-300">View Maintenance</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="viewReports"
                       checked={formData.permissions.viewReports}
                       onChange={(e) => handlePermissionChange('viewReports', e.target.checked)}
                       className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                     />
                     <Label htmlFor="viewReports" className="text-sm text-gray-300">View Reports</Label>
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id="addComments"
                       checked={formData.permissions.addComments}
                       onChange={(e) => handlePermissionChange('addComments', e.target.checked)}
                       className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                     />
                     <Label htmlFor="addComments" className="text-sm text-gray-300">Add Comments</Label>
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Access Duration */}
          <div>
            <Label htmlFor="expirationDays" className="text-gray-300">Access Duration</Label>
            <Select
              value={formData.expirationDays}
              onValueChange={(value) => setFormData(prev => ({ ...prev, expirationDays: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Personal Message */}
          <div>
            <Label htmlFor="message" className="text-gray-300">Personal Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
              placeholder="Add a personal message to the invitation..."
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={copyInviteLink}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 