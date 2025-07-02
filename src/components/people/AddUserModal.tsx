'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { createUser, getOrganizationsByType, Organization } from '@/app/actions/users';
import { InsuranceDocument } from '@/app/actions/insurance';
import InsuranceUpload from '@/components/common/InsuranceUpload';
import { toast } from 'sonner';
import { User, UserRole } from '@/types/user';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  defaultRole?: UserRole;
}

interface CreateUserData {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  department?: string;
  position?: string;
  company?: string;
  services?: string[];
  organization_id?: string;
  organization_name?: string;
}

export default function AddUserModal({ 
  isOpen, 
  onClose, 
  onUserAdded, 
  defaultRole = 'staff' 
}: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [showInsuranceUpload, setShowInsuranceUpload] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    full_name: '',
    role: defaultRole,
    phone: '',
    is_active: true,
    department: '',
    position: '',
    company: '',
    services: [],
    organization_id: '',
    organization_name: ''
  });
  const [newService, setNewService] = useState('');

  // Load organizations when role is renter
  const loadOrganizations = async () => {
    if (formData.role === 'renter') {
      setLoadingOrganizations(true);
      try {
        const result = await getOrganizationsByType('renter');
        if (result.data && Array.isArray(result.data)) {
          setOrganizations(result.data);
        }
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setLoadingOrganizations(false);
      }
    }
  };

  // Load organizations when role changes to renter
  React.useEffect(() => {
    loadOrganizations();
  }, [formData.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.email || !formData.full_name || !formData.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Renter-specific validation
      if (formData.role === 'renter' && !formData.organization_id) {
        toast.error('Please select an organization for the renter');
        return;
      }

      // Clean up data based on role
      const cleanData: CreateUserData = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
        phone: formData.phone?.trim() || undefined,
        is_active: true
      };

      // Add role-specific fields
      if (['staff', 'manager', 'coordinator'].includes(formData.role)) {
        if (formData.department?.trim()) {
          cleanData.department = formData.department.trim();
        }
        if (formData.position?.trim()) {
          cleanData.position = formData.position.trim();
        }
      }

      if (formData.role === 'vendor') {
        if (formData.company?.trim()) {
          cleanData.company = formData.company.trim();
        }
        if (formData.services && formData.services.length > 0) {
          cleanData.services = formData.services.filter(s => s.trim().length > 0);
        }
      }

      if (formData.role === 'renter') {
        cleanData.organization_id = formData.organization_id;
        cleanData.organization_name = formData.organization_name;
      }

      const result = await createUser(cleanData);

      if (result.error) {
        toast.error(`Failed to create user: ${result.error}`);
        return;
      }

      const user = result.data as any;
      toast.success(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} user created successfully!`);
      
      // For renters, show insurance upload option
      if (formData.role === 'renter') {
        setCreatedUserId(user.id);
        setShowInsuranceUpload(true);
      } else {
        // For non-renters, complete immediately
        handleCompleteCreation();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteCreation = () => {
    // Reset form and close
    setFormData({
      email: '',
      full_name: '',
      role: defaultRole,
      phone: '',
      is_active: true,
      department: '',
      position: '',
      company: '',
      services: [],
      organization_id: '',
      organization_name: ''
    });
    setNewService('');
    setCreatedUserId(null);
    setShowInsuranceUpload(false);
    onUserAdded();
    onClose();
  };

  const handleCloseModal = () => {
    // Reset all state when closing
    setFormData({
      email: '',
      full_name: '',
      role: defaultRole,
      phone: '',
      is_active: true,
      department: '',
      position: '',
      company: '',
      services: [],
      organization_id: '',
      organization_name: ''
    });
    setNewService('');
    setCreatedUserId(null);
    setShowInsuranceUpload(false);
    onClose();
  };

  const handleSkipInsurance = () => {
    // Skip insurance upload and complete
    handleCompleteCreation();
  };

  const handleFinishInsurance = () => {
    // Complete the user creation process
    handleCompleteCreation();
  };

  const handleAddService = () => {
    if (newService.trim() && !formData.services?.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...(prev.services || []), newService.trim()]
      }));
      setNewService('');
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.filter(service => service !== serviceToRemove) || []
    }));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'staff': return 'Staff Member';
      case 'manager': return 'Manager';
      case 'coordinator': return 'Coordinator';
      case 'vendor': return 'Vendor';
      case 'renter': return 'Renter';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {!showInsuranceUpload ? (
              `Add ${getRoleLabel(formData.role)}`
            ) : (
              'Upload Insurance Documents'
            )}
          </DialogTitle>
        </DialogHeader>

        {!showInsuranceUpload ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-300">Basic Information</h3>
            
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'staff' | 'manager' | 'coordinator' | 'vendor') => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="staff" className="text-white hover:bg-gray-700">
                    Staff Member
                  </SelectItem>
                  <SelectItem value="manager" className="text-white hover:bg-gray-700">
                    Manager
                  </SelectItem>
                  <SelectItem value="coordinator" className="text-white hover:bg-gray-700">
                    Coordinator
                  </SelectItem>
                  <SelectItem value="vendor" className="text-white hover:bg-gray-700">
                    Vendor
                  </SelectItem>
                  <SelectItem value="renter" className="text-white hover:bg-gray-700">
                    Renter
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-300">
                {formData.role === 'vendor' ? 'Company/Contact Name' : 'Full Name'} *
              </Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder={formData.role === 'vendor' ? 'e.g., ABC Construction' : 'e.g., John Smith'}
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="e.g., john@company.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                placeholder="e.g., +1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Renter organization selection */}
          {formData.role === 'renter' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Organization Assignment</h3>
              
              {/* Organization Selection */}
              <div className="space-y-2">
                <Label htmlFor="organization_id" className="text-gray-300">Organization *</Label>
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) => {
                    const selectedOrg = organizations.find(org => org.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      organization_id: value,
                      organization_name: selectedOrg?.name || ''
                    }));
                  }}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder={loadingOrganizations ? "Loading organizations..." : "Select organization"} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id} className="text-white hover:bg-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{org.name}</span>
                          <span className="text-xs text-gray-400">
                            {org.subtype === 'individual' ? 'Individual' : 
                             org.subtype === 'commercial' ? 'Commercial' : 'Non-Profit'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {organizations.length === 0 && !loadingOrganizations && (
                  <p className="text-xs text-gray-500">
                    No organizations found. Please create an organization first.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Role-specific fields */}
          {['staff', 'manager', 'coordinator'].includes(formData.role) && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Work Information</h3>
              
              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-gray-300">Department</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="e.g., Maintenance, Operations, Events"
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position" className="text-gray-300">Position</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="e.g., Facility Coordinator, Event Manager"
                />
              </div>
            </div>
          )}

          {/* Vendor-specific fields */}
          {formData.role === 'vendor' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Vendor Information</h3>
              
              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-300">Company Name</Label>
                <Input
                  id="company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  placeholder="e.g., ABC Construction Inc."
                />
              </div>

              {/* Services */}
              <div className="space-y-2">
                <Label className="text-gray-300">Services Provided</Label>
                
                {/* Add Service Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    placeholder="e.g., Construction, Maintenance"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddService}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!newService.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Services List */}
                {formData.services && formData.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.services.map((service, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-purple-600/20 text-purple-300 border-purple-500/30"
                      >
                        {service}
                        <button
                          type="button"
                          onClick={() => handleRemoveService(service)}
                          className="ml-2 hover:text-purple-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : `Create ${getRoleLabel(formData.role)}`}
            </Button>
          </div>
        </form>
        ) : (
          // Insurance Upload Section for Renters
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-300 mb-4">
                Renter created successfully! You can now upload insurance documents.
              </p>
            </div>

            {createdUserId && (
              <InsuranceUpload
                entityType="user"
                entityId={createdUserId}
                className="max-h-[500px] overflow-y-auto"
              />
            )}

            {/* Insurance Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipInsurance}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleFinishInsurance}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Finish
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 