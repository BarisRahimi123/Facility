'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBuildingSystem } from '@/app/actions/buildings';
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

interface AddSystemModalProps {
  buildingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const systemTypes = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'fire_safety', label: 'Fire Safety' },
  { value: 'security', label: 'Security' },
  { value: 'elevator', label: 'Elevator' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'other', label: 'Other' }
];

const conditions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'critical', label: 'Critical' }
];

const maintenanceSchedules = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'as_needed', label: 'As Needed' }
];

export default function AddSystemModal({ buildingId, isOpen, onClose }: AddSystemModalProps) {
  const [loading, setLoading] = useState(false);
  const [installationDate, setInstallationDate] = useState('');
  const [maintenanceSchedule, setMaintenanceSchedule] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // Function to calculate next maintenance date
  const calculateNextMaintenanceDate = (installDate: string, schedule: string): string => {
    if (!installDate || !schedule) return '';
    
    const install = new Date(installDate);
    const nextDate = new Date(install);
    
    switch (schedule) {
      case 'weekly':
        nextDate.setDate(install.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(install.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(install.getMonth() + 3);
        break;
      case 'semi_annual':
        nextDate.setMonth(install.getMonth() + 6);
        break;
      case 'annual':
        nextDate.setFullYear(install.getFullYear() + 1);
        break;
      case 'as_needed':
        return ''; // No automatic date for as-needed maintenance
      default:
        return '';
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  // Update next maintenance date when installation date or schedule changes
  useEffect(() => {
    const calculatedDate = calculateNextMaintenanceDate(installationDate, maintenanceSchedule);
    setNextMaintenanceDate(calculatedDate);
  }, [installationDate, maintenanceSchedule]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInstallationDate('');
      setMaintenanceSchedule('');
      setNextMaintenanceDate('');
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append('buildingId', buildingId);
      
      await createBuildingSystem(formData);
      
      toast({
        title: 'System added',
        description: 'The building system has been added successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error adding system:', error);
      toast({
        title: 'Failed to add system',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Building System</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new system to track for this building.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemType" className="text-gray-300">
                  System Type
                </Label>
                <Select name="systemType" required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {systemTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  System Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Main HVAC Unit"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer" className="text-gray-300">
                  Manufacturer
                </Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  placeholder="e.g., Carrier"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model" className="text-gray-300">
                  Model
                </Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g., 50XL-A"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installationDate" className="text-gray-300">
                  Installation Date
                </Label>
                <Input
                  id="installationDate"
                  name="installationDate"
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry" className="text-gray-300">
                  Warranty Expiry
                </Label>
                <Input
                  id="warrantyExpiry"
                  name="warrantyExpiry"
                  type="date"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition" className="text-gray-300">
                  Current Condition
                </Label>
                <Select name="condition" required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {conditions.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenanceSchedule" className="text-gray-300">
                  Maintenance Schedule
                </Label>
                <Select 
                  name="maintenanceSchedule" 
                  value={maintenanceSchedule}
                  onValueChange={setMaintenanceSchedule}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {maintenanceSchedules.map((schedule) => (
                      <SelectItem key={schedule.value} value={schedule.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {schedule.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nextMaintenanceDate" className="text-gray-300">
                Next Maintenance Date
                <span className="text-sm text-gray-500 ml-2">(Auto-calculated)</span>
              </Label>
              <Input
                id="nextMaintenanceDate"
                name="nextMaintenanceDate"
                type="date"
                value={nextMaintenanceDate}
                readOnly
                className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                placeholder={maintenanceSchedule === 'as_needed' ? 'No scheduled date for as-needed maintenance' : 'Select installation date and schedule'}
              />
              {maintenanceSchedule === 'as_needed' && (
                <p className="text-sm text-gray-500">
                  As-needed maintenance doesn't have a scheduled date
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maintenanceDescription" className="text-gray-300">
                Maintenance Details
              </Label>
              <Textarea
                id="maintenanceDescription"
                name="maintenanceDescription"
                placeholder="Describe maintenance requirements..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                rows={3}
              />
            </div>

            {/* Maintenance Contact Information */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Maintenance Contact Information</h3>
              <p className="text-sm text-gray-400 mb-4">Contact details for maintenance reminders via email and SMS</p>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-gray-300">
                      Contact Name
                    </Label>
                    <Input
                      id="contactName"
                      name="contactName"
                      placeholder="e.g., John Smith"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactCompany" className="text-gray-300">
                      Company
                    </Label>
                    <Input
                      id="contactCompany"
                      name="contactCompany"
                      placeholder="e.g., ABC Maintenance Services"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      placeholder="e.g., john@abcmaintenance.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-gray-300">
                      Telephone Number
                    </Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      placeholder="e.g., (555) 123-4567"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
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
              {loading ? 'Adding...' : 'Add System'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}  