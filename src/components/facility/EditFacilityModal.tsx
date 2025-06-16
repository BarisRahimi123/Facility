'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { updateFacility } from '@/app/actions/facilities';
import type { Facility, FacilityType, FacilityStatus } from '@/types/facility';

interface EditFacilityModalProps {
  facility: Facility;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedFacility: Facility) => void;
}

export default function EditFacilityModal({
  facility,
  isOpen,
  onClose,
  onUpdate,
}: EditFacilityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Parse address into components
  const addressParts = facility.address.split(',').map(part => part.trim());
  const [street, city, stateZip] = addressParts;
  const [state, zip] = stateZip ? stateZip.split(' ').map(part => part.trim()) : ['', ''];

  const [formData, setFormData] = useState({
    name: facility.name,
    street: street || '',
    city: city || '',
    state: state || '',
    zip: zip || '',
    type: facility.facility_type,
    status: facility.status,
    squareFootage: facility.square_footage?.toString() || '',
    yearBuilt: facility.year_built?.toString() || '',
    facilityConditionIndex: facility.facility_condition_index?.toString() || '',
    description: facility.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('address', formData.street);
      form.append('city', formData.city);
      form.append('state', formData.state);
      form.append('zip', formData.zip);
      form.append('type', formData.type);
      form.append('status', formData.status);
      form.append('squareFootage', formData.squareFootage);
      form.append('yearBuilt', formData.yearBuilt);
      form.append('facilityConditionIndex', formData.facilityConditionIndex);
      form.append('description', formData.description);

      await updateFacility(facility.id, form);

      const updatedFacility: Facility = {
        ...facility,
        name: formData.name,
        address: `${formData.street}, ${formData.city}, ${formData.state} ${formData.zip}`,
        facility_type: formData.type as FacilityType,
        status: formData.status as FacilityStatus,
        square_footage: parseInt(formData.squareFootage || '0'),
        year_built: formData.yearBuilt || undefined,
        facility_condition_index: parseInt(formData.facilityConditionIndex || '0'),
        description: formData.description,
        updated_at: new Date().toISOString(),
      };

      onUpdate(updatedFacility);
      onClose();
      toast({
        title: "Success",
        description: "Facility updated successfully",
      });
    } catch (error) {
      console.error('Error updating facility:', error);
      toast({
        title: "Error",
        description: "Failed to update facility",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border border-gray-800 sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Edit Facility</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Street Address</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">ZIP Code</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as FacilityType })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Office" className="text-white">Office</SelectItem>
                    <SelectItem value="Warehouse" className="text-white">Warehouse</SelectItem>
                    <SelectItem value="Retail" className="text-white">Retail</SelectItem>
                    <SelectItem value="Industrial" className="text-white">Industrial</SelectItem>
                    <SelectItem value="Healthcare" className="text-white">Healthcare</SelectItem>
                    <SelectItem value="Education" className="text-white">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as FacilityStatus })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="active" className="text-white">Active</SelectItem>
                    <SelectItem value="maintenance" className="text-white">Maintenance</SelectItem>
                    <SelectItem value="inactive" className="text-white">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">Square Footage</Label>
                <Input
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Year Built</Label>
                <Input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label className="text-gray-300">Condition Index (%)</Label>
                <Input
                  type="number"
                  value={formData.facilityConditionIndex}
                  onChange={(e) => setFormData({ ...formData, facilityConditionIndex: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white h-24"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? 'Updating...' : 'Update Facility'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 