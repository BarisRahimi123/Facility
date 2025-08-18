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
import { Building2, Users, MapPin, Settings, Loader2 } from 'lucide-react';

export default function NewFacilityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Log form data for debugging
    console.log('📝 Submitting facility with data:');
    formData.forEach((value, key) => {
      console.log(`  ${key}:`, value);
    });
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      const loadingToast = toast.loading('Creating facility...');
      
      const result = await createFacility(formData);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Check if there's an error in the result
      if (result && 'error' in result && result.error) {
        console.error('❌ Server returned error:', result.error);
        toast.error(result.error);
        return;
      }
      
      console.log('✅ Facility created successfully:', result);
      toast.success('Facility created successfully');
      router.push('/facilities');
      router.refresh();
    } catch (error) {
      console.error('❌ Error creating facility:', error);
      
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-lg">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Facility</h1>
              <p className="text-muted-foreground">Add a new facility to your portfolio</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border shadow-2xl">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
              </div>

              {/* Facility Name - Full width */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Facility Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Main Campus or Elementary School Building A"
                  required
                  className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                />
              </div>

              {/* Address - Full width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-foreground">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Full street address"
                  required
                  className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                />
              </div>
              
              {/* City, State, Zip - Grid layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-foreground">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="City"
                    required
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium text-foreground">
                    State
                  </Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="State"
                    required
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm font-medium text-foreground">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip"
                    name="zip"
                    placeholder="ZIP"
                    required
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                  />
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Classification</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-foreground">
                    Facility Type
                  </Label>
                  <Select name="type" required>
                    <SelectTrigger className="bg-input border-border text-foreground h-12 focus:border-ring focus:ring-ring/20">
                      <SelectValue placeholder="Select a facility type" className="text-foreground" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Object.values(FacilityTypes).map((type) => (
                        <SelectItem key={type} value={type} className="text-foreground hover:bg-accent focus:bg-accent">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-foreground">
                    Status
                  </Label>
                  <Select name="status" required>
                    <SelectTrigger className="bg-input border-border text-foreground h-12 focus:border-ring focus:ring-ring/20">
                      <SelectValue placeholder="Select a status" className="text-foreground" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="active" className="text-foreground hover:bg-accent focus:bg-accent">Active</SelectItem>
                      <SelectItem value="inactive" className="text-foreground hover:bg-accent focus:bg-accent">Inactive</SelectItem>
                      <SelectItem value="maintenance" className="text-foreground hover:bg-accent focus:bg-accent">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Specifications Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Specifications</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="squareFootage" className="text-sm font-medium text-foreground">
                    Square Footage
                    <span className="text-xs text-muted-foreground ml-1">
                      (Gross Floor Area)
                    </span>
                  </Label>
                  <Input
                    id="squareFootage"
                    name="squareFootage"
                    type="number"
                    placeholder="e.g., 25000"
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearBuilt" className="text-sm font-medium text-foreground">
                    Year Built
                    <span className="text-xs text-muted-foreground ml-1">
                      (Original Construction)
                    </span>
                  </Label>
                  <Input
                    id="yearBuilt"
                    name="yearBuilt"
                    type="number"
                    placeholder="e.g., 1985"
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facilityConditionIndex" className="text-sm font-medium text-foreground">
                    Facility Condition Index
                    <span className="text-xs text-muted-foreground ml-1">
                      (FCI Score 0-100)
                    </span>
                  </Label>
                  <Input
                    id="facilityConditionIndex"
                    name="facilityConditionIndex"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 75.5"
                    className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 h-12"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Additional Information</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                  Notes & Comments
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes about this facility..."
                  className="bg-input border-border text-foreground placeholder-muted-foreground focus:border-ring focus:ring-ring/20 min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
                className="border-border text-foreground hover:bg-accent hover:text-foreground px-6 h-12"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-12 shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Facility'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 