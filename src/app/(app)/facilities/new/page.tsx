'use client';

import { createFacility } from '@/app/actions/facilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FacilityTypes } from '@/types/facility';
import { Building2, Users, MapPin, Settings } from 'lucide-react';

export default function NewFacilityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Creating facility...');
      
      await createFacility(formData);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.success('Facility created successfully');
      router.push('/facilities');
      router.refresh();
    } catch (error) {
      console.error('Error creating facility:', error);
      
      let errorMessage = 'Failed to create facility';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('PGRST204') || error.message.includes('schema cache')) {
          errorMessage = 'Database schema error. The facility table may be missing required columns.';
        }
        
        if (error.message.includes('authentication') || error.message.includes('auth')) {
          errorMessage = 'Authentication error. Please try refreshing the page and logging in again.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Facility</h1>
              <p className="text-gray-400">Add a new facility to your portfolio</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Basic Information</h2>
              </div>

              {/* Facility Name - Full width */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Facility Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Main Campus or Elementary School Building A"
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                />
              </div>

              {/* Address - Full width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-300">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Full street address"
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                />
              </div>
              
              {/* City, State, Zip - Grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-300">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-gray-300">
                    State
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-medium text-gray-300">
                    Zip Code
                  </Label>
                  <Input
                    id="zip"
                    name="zip"
                    placeholder="Zip Code"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                  />
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                  <Settings className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Classification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Facility Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-300">
                    Facility Type
                  </Label>
                  <Select name="type" required>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 focus:border-purple-500 focus:ring-purple-500/20">
                      <SelectValue placeholder="Select a facility type" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.values(FacilityTypes).map((type) => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-300">
                    Status
                  </Label>
                  <Select name="status" required>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white h-12 focus:border-purple-500 focus:ring-purple-500/20">
                      <SelectValue placeholder="Select a status" className="text-white" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="active" className="text-white hover:bg-gray-700 focus:bg-gray-700">Active</SelectItem>
                      <SelectItem value="inactive" className="text-white hover:bg-gray-700 focus:bg-gray-700">Inactive</SelectItem>
                      <SelectItem value="maintenance" className="text-white hover:bg-gray-700 focus:bg-gray-700">Maintenance</SelectItem>
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
                <h2 className="text-xl font-semibold text-white">Specifications</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Square Footage */}
                <div className="space-y-2">
                  <Label htmlFor="squareFootage" className="text-sm font-medium text-gray-300">
                    Acres
                  </Label>
                  <Input
                    id="squareFootage"
                    name="squareFootage"
                    type="number"
                    min="0"
                    placeholder="Total acres"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                  />
                </div>

                {/* Year Built */}
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt" className="text-sm font-medium text-gray-300">
                    Year Built
                  </Label>
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="e.g., 2010"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                  />
                </div>

                {/* FCI Score */}
                <div className="space-y-2">
                  <Label htmlFor="facilityConditionIndex" className="text-sm font-medium text-gray-300">
                    FCI Score (0-100)
                    <span className="text-xs text-gray-500 block font-normal">
                      Facility Condition Index
                    </span>
                  </Label>
                  <Input
                    id="facilityConditionIndex"
                    name="facilityConditionIndex"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 85"
                    required
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 h-12"
                  />
                </div>
              </div>
            </div>


              
            {/* Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Additional Information</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-300">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional notes about this facility"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 min-h-[100px] resize-none"
                />
              </div>
            </div>



            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/facilities')}
                disabled={isSubmitting}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 h-12"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 h-12 shadow-lg"
              >
                {isSubmitting ? 'Creating...' : 'Create Facility'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 