'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateRenovation } from '@/app/actions/buildings';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface EditRenovationModalProps {
  renovation: any;
  buildingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const statusOptions = [
  'planning',
  'in_progress', 
  'completed',
  'on_hold'
];

const fundingSourceOptions = [
  'capital_budget',
  'maintenance_budget',
  'grant',
  'bond',
  'other'
];

const dsaApprovalOptions = [
  'approved',
  'pending',
  'not_required'
];

export default function EditRenovationModal({ renovation, buildingId, isOpen, onClose }: EditRenovationModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [scopeOfWork, setScopeOfWork] = useState('');
  const [squareFootageAffected, setSquareFootageAffected] = useState('');
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [status, setStatus] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorContact, setContractorContact] = useState('');
  const [permitNumbers, setPermitNumbers] = useState('');
  const [notes, setNotes] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [dsaApprovalStatus, setDsaApprovalStatus] = useState('');
  const [architectName, setArchitectName] = useState('');
  const [projectManagerName, setProjectManagerName] = useState('');

  // Initialize form values when renovation changes
  useEffect(() => {
    if (renovation) {
      setScopeOfWork(renovation.scope_of_work || '');
      setSquareFootageAffected(renovation.square_footage_affected?.toString() || '');
      setStartDate(renovation.start_date || '');
      setCompletionDate(renovation.completion_date || '');
      setStatus(renovation.status || '');
      setEstimatedBudget(renovation.estimated_budget?.toString() || '');
      setActualCost(renovation.actual_cost?.toString() || '');
      setContractorName(renovation.contractor_name || '');
      setContractorContact(renovation.contractor_contact || '');
      setPermitNumbers(renovation.permit_numbers || '');
      setNotes(renovation.notes || '');
      setFundingSource(renovation.funding_source || '');
      setDsaApprovalStatus(renovation.dsa_approval_status || '');
      setArchitectName(renovation.architect_firm?.name || '');
      setProjectManagerName(renovation.project_manager?.name || '');
    }
  }, [renovation]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('buildingId', buildingId);
      formData.append('scope_of_work', scopeOfWork);
      formData.append('square_footage_affected', squareFootageAffected);
      formData.append('start_date', startDate);
      formData.append('completion_date', completionDate);
      formData.append('status', status);
      formData.append('estimated_budget', estimatedBudget);
      if (actualCost) formData.append('actual_cost', actualCost);
      if (contractorName) formData.append('contractor_name', contractorName);
      if (contractorContact) formData.append('contractor_contact', contractorContact);
      if (permitNumbers) formData.append('permit_numbers', permitNumbers);
      if (notes) formData.append('notes', notes);
      formData.append('funding_source', fundingSource);
      formData.append('dsa_approval_status', dsaApprovalStatus);
      if (architectName) formData.append('architect_name', architectName);
      if (projectManagerName) formData.append('project_manager_name', projectManagerName);
      
      await updateRenovation(renovation.id, formData);
      
      toast({
        title: 'Renovation updated',
        description: 'The renovation has been updated successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error updating renovation:', error);
      toast({
        title: 'Failed to update renovation',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!renovation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-800 max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Renovation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the details for this renovation project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="scopeOfWork" className="text-gray-300 mb-2 block">
                Scope of Work *
              </Label>
              <Textarea
                id="scopeOfWork"
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                placeholder="Describe the renovation work..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="squareFootageAffected" className="text-gray-300 mb-2 block">
                  Square Footage Affected
                </Label>
                <Input
                  id="squareFootageAffected"
                  type="number"
                  value={squareFootageAffected}
                  onChange={(e) => setSquareFootageAffected(e.target.value)}
                  placeholder="1000"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-gray-300 mb-2 block">
                  Status *
                </Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {statusOptions.map((stat) => (
                      <SelectItem key={stat} value={stat} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {stat.replace('_', ' ').charAt(0).toUpperCase() + stat.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-gray-300 mb-2 block">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="completionDate" className="text-gray-300 mb-2 block">
                  Completion Date
                </Label>
                <Input
                  id="completionDate"
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedBudget" className="text-gray-300 mb-2 block">
                  Estimated Budget
                </Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  placeholder="50000"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="actualCost" className="text-gray-300 mb-2 block">
                  Actual Cost
                </Label>
                <Input
                  id="actualCost"
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="52000"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractorName" className="text-gray-300 mb-2 block">
                  Contractor Name
                </Label>
                <Input
                  id="contractorName"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="ABC Construction"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="contractorContact" className="text-gray-300 mb-2 block">
                  Contractor Contact
                </Label>
                <Input
                  id="contractorContact"
                  value={contractorContact}
                  onChange={(e) => setContractorContact(e.target.value)}
                  placeholder="phone or email"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fundingSource" className="text-gray-300 mb-2 block">
                  Funding Source
                </Label>
                <Select value={fundingSource} onValueChange={setFundingSource}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select funding source" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {fundingSourceOptions.map((source) => (
                      <SelectItem key={source} value={source} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {source.replace('_', ' ').charAt(0).toUpperCase() + source.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dsaApprovalStatus" className="text-gray-300 mb-2 block">
                  DSA Approval Status
                </Label>
                <Select value={dsaApprovalStatus} onValueChange={setDsaApprovalStatus}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select DSA status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {dsaApprovalOptions.map((approval) => (
                      <SelectItem key={approval} value={approval} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {approval.replace('_', ' ').charAt(0).toUpperCase() + approval.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="architectName" className="text-gray-300 mb-2 block">
                  Architect Name
                </Label>
                <Input
                  id="architectName"
                  value={architectName}
                  onChange={(e) => setArchitectName(e.target.value)}
                  placeholder="Architect firm name"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="projectManagerName" className="text-gray-300 mb-2 block">
                  Project Manager
                </Label>
                <Input
                  id="projectManagerName"
                  value={projectManagerName}
                  onChange={(e) => setProjectManagerName(e.target.value)}
                  placeholder="Project manager name"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="permitNumbers" className="text-gray-300 mb-2 block">
                Permit Numbers
              </Label>
              <Input
                id="permitNumbers"
                value={permitNumbers}
                onChange={(e) => setPermitNumbers(e.target.value)}
                placeholder="Enter permit numbers"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-gray-300 mb-2 block">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the renovation..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                rows={3}
              />
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
              {loading ? 'Updating...' : 'Update Renovation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 