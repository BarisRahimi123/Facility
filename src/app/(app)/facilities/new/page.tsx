'use client';

import { createFacility } from '@/app/actions/facilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FacilityTypes } from '@/types/facility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewFacilityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    console.log('Form submitted!');
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      setIsSubmitting(true);
      
      // Log the form data for debugging
      console.log('Form data being submitted:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
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
      
      // Handle specific database errors
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for database schema errors
        if (error.message.includes('PGRST204') || error.message.includes('schema cache')) {
          errorMessage = 'Database schema error. The facility table may be missing required columns.';
        }
        
        // Check for authentication errors
        if (error.message.includes('authentication') || error.message.includes('auth')) {
          errorMessage = 'Authentication error. Please try refreshing the page and logging in again.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Test function to check if form submission works
  function testFormSubmission() {
    console.log('Test button clicked!');
    toast.success('Test toast is working!');
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Facility</CardTitle>
          {/* Debug button */}
          <button
            type="button"
            onClick={testFormSubmission}
            className="text-xs text-blue-600 hover:underline"
          >
            Test Toast
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="space-y-4">
                  {/* Facility Name - Full width */}
                  <div>
                    <Label htmlFor="name">Facility Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Main Campus or Elementary School Building A"
                      required
                    />
                  </div>

                  {/* Address - Full width */}
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Full street address"
                      required
                    />
                  </div>
                  
                  {/* City, State, Zip - Side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="City"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        placeholder="State"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="zip">Zip Code</Label>
                      <Input
                        id="zip"
                        name="zip"
                        placeholder="Zip Code"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Classification Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Facility Type */}
                  <div>
                    <Label htmlFor="type">Facility Type</Label>
                    <select
                      id="type"
                      name="type"
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm h-10"
                      required
                    >
                      <option value="">Select a facility type</option>
                      {Object.values(FacilityTypes).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status */}
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm h-10"
                      required
                    >
                      <option value="">Select a status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Specifications Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Square Footage */}
                  <div>
                    <Label htmlFor="squareFootage">Square Footage</Label>
                    <Input
                      id="squareFootage"
                      name="squareFootage"
                      type="number"
                      min="0"
                      placeholder="Total square feet"
                      required
                    />
                  </div>

                  {/* Year Built */}
                  <div>
                    <Label htmlFor="yearBuilt">Year Built</Label>
                    <Input
                      id="yearBuilt"
                      name="yearBuilt"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder="e.g., 2010"
                      required
                    />
                  </div>

                  {/* Facility Condition Index */}
                  <div>
                    <Label htmlFor="facilityConditionIndex">
                      FCI Score (0-100)
                      <span className="text-xs text-gray-500 block">
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
                    />
                  </div>
                </div>
              </div>
              
              {/* Notes - Full width */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  name="notes"
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Additional notes about this facility"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/facilities')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Facility'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 