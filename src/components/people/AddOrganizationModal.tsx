'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Building2, Users, Briefcase } from 'lucide-react';
import { createOrganization, CreateOrganizationData } from '@/app/actions/users';
import { InsuranceDocument } from '@/app/actions/insurance';
import InsuranceUpload from '@/components/common/InsuranceUpload';
import { toast } from 'sonner';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationAdded: () => void;
}

export default function AddOrganizationModal({ 
  isOpen, 
  onClose, 
  onOrganizationAdded 
}: AddOrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [createdOrganizationId, setCreatedOrganizationId] = useState<string | null>(null);
  const [showInsuranceUpload, setShowInsuranceUpload] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationData>({
    type: 'renter',
    subtype: 'commercial',
    name: '',
    display_name: '',
    tax_id: '',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    billing_email: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    requires_insurance: true,
    minimum_liability_coverage: 1000000,
    payment_terms: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.name || !formData.primary_contact_name || !formData.primary_contact_email) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Clean up data
      const cleanData: CreateOrganizationData = {
        type: formData.type,
        subtype: formData.subtype,
        name: formData.name.trim(),
        display_name: formData.display_name?.trim() || undefined,
        tax_id: formData.tax_id?.trim() || undefined,
        primary_contact_name: formData.primary_contact_name.trim(),
        primary_contact_email: formData.primary_contact_email.trim(),
        primary_contact_phone: formData.primary_contact_phone?.trim() || undefined,
        billing_email: formData.billing_email?.trim() || undefined,
        street_address: formData.street_address?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        zip_code: formData.zip_code?.trim() || undefined,
        requires_insurance: formData.requires_insurance,
        minimum_liability_coverage: formData.minimum_liability_coverage,
        payment_terms: formData.payment_terms?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      const result = await createOrganization(cleanData);

      if (result.error) {
        toast.error(`Failed to create organization: ${result.error}`);
        return;
      }

      const organization = result.data as any;
      toast.success(`${formData.subtype === 'individual' ? 'Individual' : 'Organization'} created successfully!`);
      
      // Store the created organization ID and show insurance upload
      setCreatedOrganizationId(organization.id);
      setShowInsuranceUpload(true);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all state
    setFormData({
      type: 'renter',
      subtype: 'commercial',
      name: '',
      display_name: '',
      tax_id: '',
      primary_contact_name: '',
      primary_contact_email: '',
      primary_contact_phone: '',
      billing_email: '',
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      requires_insurance: true,
      minimum_liability_coverage: 1000000,
      payment_terms: '',
      notes: ''
    });
    setCreatedOrganizationId(null);
    setShowInsuranceUpload(false);
    onClose();
  };

  const handleFinishInsurance = () => {
    // Complete the organization creation process
    onOrganizationAdded();
    handleClose();
  };

  const handleSkipInsurance = () => {
    // Skip insurance upload and complete
    onOrganizationAdded();
    handleClose();
  };

  const getSubtypeIcon = (subtype: string) => {
    switch (subtype) {
      case 'individual': return <Users className="w-4 h-4" />;
      case 'commercial': return <Building2 className="w-4 h-4" />;
      case 'nonprofit': return <Briefcase className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getSubtypeLabel = (subtype: string) => {
    switch (subtype) {
      case 'individual': return 'Individual Renter';
      case 'commercial': return 'Commercial Organization';
      case 'nonprofit': return 'Non-Profit Organization';
      default: return subtype;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[800px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            {!showInsuranceUpload ? (
              <>
                {getSubtypeIcon(formData.subtype || 'commercial')}
                Add {getSubtypeLabel(formData.subtype || 'commercial')}
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5" />
                Upload Insurance Documents
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {!showInsuranceUpload ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Organization Type</h3>
            
            <div className="space-y-2">
              <Label htmlFor="subtype" className="text-card-foreground">Type *</Label>
              <Select
                value={formData.subtype}
                onValueChange={(value: 'individual' | 'commercial' | 'nonprofit') => 
                  setFormData(prev => ({ ...prev, subtype: value }))
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select organization type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="individual" className="text-card-foreground hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Individual Renter
                    </div>
                  </SelectItem>
                  <SelectItem value="commercial" className="text-card-foreground hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Commercial Organization
                    </div>
                  </SelectItem>
                  <SelectItem value="nonprofit" className="text-card-foreground hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Non-Profit Organization
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground">
                  {formData.subtype === 'individual' ? 'Full Name' : 'Organization Name'} *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder={formData.subtype === 'individual' ? 'e.g., John Smith' : 'e.g., ABC Sports Club'}
                  required
                />
              </div>

              {/* Display Name */}
              {formData.subtype !== 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-card-foreground">Display Name</Label>
                  <Input
                    id="display_name"
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., ABC Sports"
                  />
                </div>
              )}

              {/* Tax ID */}
              {formData.subtype !== 'individual' && (
                <div className="space-y-2">
                  <Label htmlFor="tax_id" className="text-card-foreground">Tax ID / EIN</Label>
                  <Input
                    id="tax_id"
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., 12-3456789"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Primary Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Primary Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact_name" className="text-card-foreground">Contact Name *</Label>
                <Input
                  id="primary_contact_name"
                  type="text"
                  value={formData.primary_contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_phone" className="text-card-foreground">Phone</Label>
                <Input
                  id="primary_contact_phone"
                  type="tel"
                  value={formData.primary_contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_phone: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., +1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_email" className="text-card-foreground">Email *</Label>
                <Input
                  id="primary_contact_email"
                  type="email"
                  value={formData.primary_contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., contact@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_email" className="text-card-foreground">Billing Email</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={formData.billing_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_email: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., billing@company.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street_address" className="text-card-foreground">Street Address</Label>
                <Input
                  id="street_address"
                  type="text"
                  value={formData.street_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, street_address: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., 123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-card-foreground">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    placeholder="e.g., San Francisco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-card-foreground">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code" className="text-card-foreground">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Requirements */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Insurance Requirements</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-card-foreground">Requires Insurance</Label>
                  <p className="text-xs text-muted-foreground">Does this organization need to provide insurance?</p>
                </div>
                <Switch
                  checked={formData.requires_insurance}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_insurance: checked }))}
                />
              </div>

              {formData.requires_insurance && (
                <div className="space-y-2">
                  <Label htmlFor="minimum_liability_coverage" className="text-card-foreground">Minimum Liability Coverage ($)</Label>
                  <Input
                    id="minimum_liability_coverage"
                    type="number"
                    value={formData.minimum_liability_coverage}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_liability_coverage: parseInt(e.target.value) || 0 }))}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    placeholder="1000000"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Additional Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms" className="text-card-foreground">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., Net 30, Payment on booking"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-card-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="Additional notes about this organization..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-border text-muted-foreground hover:bg-accent"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : `Create ${getSubtypeLabel(formData.subtype || 'commercial')}`}
            </Button>
          </div>
        </form>
        ) : (
          // Insurance Upload Section
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-card-foreground mb-4">
                Organization created successfully! Now you can upload insurance documents.
              </p>
            </div>

            {createdOrganizationId && (
              <InsuranceUpload
                entityType="organization"
                entityId={createdOrganizationId}
                className="max-h-[500px] overflow-y-auto"
              />
            )}

            {/* Insurance Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipInsurance}
                className="border-border text-muted-foreground hover:bg-accent"
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