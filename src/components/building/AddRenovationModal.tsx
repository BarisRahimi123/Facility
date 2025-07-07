'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRenovation } from '@/app/actions/buildings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface AddRenovationModalProps {
  buildingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const renovationStatuses = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' }
];

const fundingSources = [
  { value: 'capital_budget', label: 'Capital Budget' },
  { value: 'operating_budget', label: 'Operating Budget' },
  { value: 'grant', label: 'Grant' },
  { value: 'bond', label: 'Bond' },
  { value: 'donation', label: 'Donation' },
  { value: 'other', label: 'Other' }
];

const dsaApprovalStatuses = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'not_required', label: 'Not Required' }
];

export default function AddRenovationModal({ buildingId, isOpen, onClose }: AddRenovationModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('buildingId', buildingId);
      
      await createRenovation(buildingId, formData);
      
      toast({
        title: 'Renovation added',
        description: 'The renovation project has been added successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error adding renovation:', error);
      toast({
        title: 'Failed to add renovation',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Renovation Project</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new renovation or improvement project for this building.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">Project Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="scope_of_work" className="text-gray-300">
                  Scope of Work
                </Label>
                <Textarea
                  id="scope_of_work"
                  name="scope_of_work"
                  placeholder="Describe the renovation work to be done..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="square_footage_affected" className="text-gray-300">
                    Square Footage Affected
                  </Label>
                  <Input
                    id="square_footage_affected"
                    name="square_footage_affected"
                    type="number"
                    placeholder="e.g., 5000"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-300">
                    Status
                  </Label>
                  <Select name="status" defaultValue="planning">
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {renovationStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-gray-300">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completion_date" className="text-gray-300">
                    Completion Date
                  </Label>
                  <Input
                    id="completion_date"
                    name="completion_date"
                    type="date"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Budget Information */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Budget Information</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimated_budget" className="text-gray-300">
                    Estimated Budget
                  </Label>
                  <Input
                    id="estimated_budget"
                    name="estimated_budget"
                    type="number"
                    placeholder="e.g., 500000"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="actual_cost" className="text-gray-300">
                    Actual Cost
                  </Label>
                  <Input
                    id="actual_cost"
                    name="actual_cost"
                    type="number"
                    placeholder="e.g., 525000"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="funding_source" className="text-gray-300">
                    Funding Source
                  </Label>
                  <Select name="funding_source" defaultValue="capital_budget">
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {fundingSources.map((source) => (
                        <SelectItem key={source.value} value={source.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Contractor Information */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Contractor Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractor_name" className="text-gray-300">
                    Contractor Name
                  </Label>
                  <Input
                    id="contractor_name"
                    name="contractor_name"
                    placeholder="e.g., ABC Construction"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractor_contact" className="text-gray-300">
                    Contractor Contact
                  </Label>
                  <Input
                    id="contractor_contact"
                    name="contractor_contact"
                    placeholder="e.g., 555-0123"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="architect_name" className="text-gray-300">
                    Architect Firm
                  </Label>
                  <Input
                    id="architect_name"
                    name="architect_name"
                    placeholder="e.g., XYZ Architects"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project_manager_name" className="text-gray-300">
                    Project Manager
                  </Label>
                  <Input
                    id="project_manager_name"
                    name="project_manager_name"
                    placeholder="e.g., John Doe"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Permits and Approvals */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Permits and Approvals</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permit_numbers" className="text-gray-300">
                    Permit Numbers
                  </Label>
                  <Input
                    id="permit_numbers"
                    name="permit_numbers"
                    placeholder="e.g., BP-2023-001"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dsa_approval_status" className="text-gray-300">
                    DSA Approval Status
                  </Label>
                  <Select name="dsa_approval_status" defaultValue="not_required">
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {dsaApprovalStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Additional Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional notes or comments..."
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Renovation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 