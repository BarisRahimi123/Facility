'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { updateFacility } from '@/app/actions/facilities';
import type { Facility, FacilityType, FacilityStatus } from '@/types/facility';
import { Building2, Users, MapPin, Settings, Toilet } from 'lucide-react';

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
    boysToilets: facility.boys_toilets?.toString() || '0',
    boysUrinals: facility.boys_urinals?.toString() || '0',
    boysSinks: facility.boys_sinks?.toString() || '0',
    boysRestroomsCount: facility.boys_restrooms_count?.toString() || '0',
    girlsToilets: facility.girls_toilets?.toString() || '0',
    girlsUrinals: facility.girls_urinals?.toString() || '0',
    girlsSinks: facility.girls_sinks?.toString() || '0',
    girlsRestroomsCount: facility.girls_restrooms_count?.toString() || '0',
    unisexToilets: facility.unisex_toilets?.toString() || '0',
    unisexSinks: facility.unisex_sinks?.toString() || '0',
    unisexRestroomsCount: facility.unisex_restrooms_count?.toString() || '0',
    staffToilets: facility.staff_toilets?.toString() || '0',
    staffSinks: facility.staff_sinks?.toString() || '0',
    staffRestroomsCount: facility.staff_restrooms_count?.toString() || '0'
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
      form.append('boysToilets', formData.boysToilets);
      form.append('boysUrinals', formData.boysUrinals);
      form.append('boysSinks', formData.boysSinks);
      form.append('boysRestroomsCount', formData.boysRestroomsCount);
      form.append('girlsToilets', formData.girlsToilets);
      form.append('girlsUrinals', formData.girlsUrinals);
      form.append('girlsSinks', formData.girlsSinks);
      form.append('girlsRestroomsCount', formData.girlsRestroomsCount);
      form.append('unisexToilets', formData.unisexToilets);
      form.append('unisexSinks', formData.unisexSinks);
      form.append('unisexRestroomsCount', formData.unisexRestroomsCount);
      form.append('staffToilets', formData.staffToilets);
      form.append('staffSinks', formData.staffSinks);
      form.append('staffRestroomsCount', formData.staffRestroomsCount);




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
        boys_toilets: parseInt(formData.boysToilets) || 0,
        boys_urinals: parseInt(formData.boysUrinals) || 0,
        boys_sinks: parseInt(formData.boysSinks) || 0,
        boys_restrooms_count: parseInt(formData.boysRestroomsCount) || 0,
        girls_toilets: parseInt(formData.girlsToilets) || 0,
        girls_urinals: parseInt(formData.girlsUrinals) || 0,
        girls_sinks: parseInt(formData.girlsSinks) || 0,
        girls_restrooms_count: parseInt(formData.girlsRestroomsCount) || 0,
        unisex_toilets: parseInt(formData.unisexToilets) || 0,
        unisex_sinks: parseInt(formData.unisexSinks) || 0,
        unisex_restrooms_count: parseInt(formData.unisexRestroomsCount) || 0,
        staff_toilets: parseInt(formData.staffToilets) || 0,
        staff_sinks: parseInt(formData.staffSinks) || 0,
        staff_restrooms_count: parseInt(formData.staffRestroomsCount) || 0,
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
      <DialogContent className="bg-gray-900 text-white border border-gray-700/50 sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Edit Facility</DialogTitle>
              <p className="text-gray-400 text-sm">Update facility information and restroom details</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                <MapPin className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Facility Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Street Address</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-300">City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-300">State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-300">ZIP Code</Label>
                  <Input
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Classification Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                <Settings className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Classification</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Facility Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as FacilityType })}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-11 focus:border-purple-500 focus:ring-purple-500/20">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Elementary School" className="text-white hover:bg-gray-700">Elementary School</SelectItem>
                    <SelectItem value="Middle School" className="text-white hover:bg-gray-700">Middle School</SelectItem>
                    <SelectItem value="High School" className="text-white hover:bg-gray-700">High School</SelectItem>
                    <SelectItem value="Office" className="text-white hover:bg-gray-700">Office</SelectItem>
                    <SelectItem value="Warehouse" className="text-white hover:bg-gray-700">Warehouse</SelectItem>
                    <SelectItem value="Commercial" className="text-white hover:bg-gray-700">Commercial</SelectItem>
                    <SelectItem value="Hospital" className="text-white hover:bg-gray-700">Hospital</SelectItem>
                    <SelectItem value="Other" className="text-white hover:bg-gray-700">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as FacilityStatus })}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-11 focus:border-purple-500 focus:ring-purple-500/20">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="active" className="text-white hover:bg-gray-700">Active</SelectItem>
                    <SelectItem value="maintenance" className="text-white hover:bg-gray-700">Maintenance</SelectItem>
                    <SelectItem value="inactive" className="text-white hover:bg-gray-700">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                <Building2 className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Specifications</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-300">Acres</Label>
                <Input
                  type="number"
                  value={formData.squareFootage}
                  onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">Year Built</Label>
                <Input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-300">FCI Score (0-100)</Label>
                <Input
                  type="number"
                  value={formData.facilityConditionIndex}
                  onChange={(e) => setFormData({ ...formData, facilityConditionIndex: e.target.value })}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-11"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
          </div>

          {/* Restroom Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                <Toilet className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Restroom Information</h3>
                <p className="text-sm text-gray-400">Used for automatic compliance calculations</p>
              </div>
            </div>
            
            {/* Boys Restrooms */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-300">Boys Restrooms</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-300">Toilets</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.boysToilets}
                    onChange={(e) => setFormData({ ...formData, boysToilets: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Urinals</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.boysUrinals}
                    onChange={(e) => setFormData({ ...formData, boysUrinals: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Sinks</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.boysSinks}
                    onChange={(e) => setFormData({ ...formData, boysSinks: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Restrooms</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.boysRestroomsCount}
                    onChange={(e) => setFormData({ ...formData, boysRestroomsCount: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
              </div>
            </div>

            {/* Girls Restrooms */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-300">Girls Restrooms</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-300">Toilets</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.girlsToilets}
                    onChange={(e) => setFormData({ ...formData, girlsToilets: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Urinals</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.girlsUrinals}
                    onChange={(e) => setFormData({ ...formData, girlsUrinals: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Sinks</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.girlsSinks}
                    onChange={(e) => setFormData({ ...formData, girlsSinks: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Restrooms</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.girlsRestroomsCount}
                    onChange={(e) => setFormData({ ...formData, girlsRestroomsCount: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
              </div>
            </div>

            {/* Unisex/Family Restrooms */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-300">Unisex/Family Restrooms</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-300">Toilets</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.unisexToilets}
                    onChange={(e) => setFormData({ ...formData, unisexToilets: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Sinks</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.unisexSinks}
                    onChange={(e) => setFormData({ ...formData, unisexSinks: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Restrooms</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.unisexRestroomsCount}
                    onChange={(e) => setFormData({ ...formData, unisexRestroomsCount: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
              </div>
            </div>

            {/* Staff Restrooms */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-purple-300">Staff Restrooms</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-300">Toilets</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.staffToilets}
                    onChange={(e) => setFormData({ ...formData, staffToilets: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Sinks</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.staffSinks}
                    onChange={(e) => setFormData({ ...formData, staffSinks: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">Restrooms</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.staffRestroomsCount}
                    onChange={(e) => setFormData({ ...formData, staffRestroomsCount: e.target.value })}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Additional Information</h3>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300">Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 min-h-[80px] resize-none"
                placeholder="Additional notes about this facility"
              />
            </div>
          </div>



          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 h-11 shadow-lg"
            >
              {isLoading ? 'Updating...' : 'Update Facility'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}                