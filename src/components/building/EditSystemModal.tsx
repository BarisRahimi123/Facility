'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateBuildingSystem } from '@/app/actions/buildings';
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

interface EditSystemModalProps {
  system: any;
  buildingId: string;
  isOpen: boolean;
  onClose: () => void;
}

const systemTypes = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Fire Safety',
  'Security',
  'IT/Network',
  'Elevator',
  'Lighting',
  'Other'
];

const conditionOptions = [
  'excellent',
  'good', 
  'fair',
  'poor',
  'critical'
];

const maintenanceScheduleOptions = [
  'weekly',
  'monthly',
  'quarterly',
  'annually',
  'as_needed'
];

export default function EditSystemModal({ system, buildingId, isOpen, onClose }: EditSystemModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [systemType, setSystemType] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [condition, setCondition] = useState('');
  const [maintenanceSchedule, setMaintenanceSchedule] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCompany, setContactCompany] = useState('');

  // Initialize form values when system changes
  useEffect(() => {
    if (system) {
      console.log('EditSystemModal received system data:', JSON.stringify(system, null, 2));
      
      setSystemType(system.system_type || '');
      setName(system.name || '');
      setModel(system.model || '');
      setManufacturer(system.manufacturer || '');
      setInstallationDate(system.installation_date || '');
      setWarrantyExpiry(system.warranty_expiry || '');
      setCondition(system.condition || '');
      setMaintenanceSchedule(system.maintenance_schedule || '');
      setLastMaintenanceDate(system.last_maintenance_date || '');
      setNextMaintenanceDate(system.next_maintenance_date || '');
      
      // Initialize contact information
      const contact = system.maintenance_contact || {};
      console.log('Maintenance contact data:', JSON.stringify(contact, null, 2));
      
      setContactName(contact.name || '');
      setContactEmail(contact.email || '');
      setContactPhone(contact.phone || '');
      setContactCompany(contact.company || '');
    }
  }, [system]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('buildingId', buildingId);
      formData.append('systemType', systemType);
      formData.append('name', name);
      formData.append('model', model);
      formData.append('manufacturer', manufacturer);
      formData.append('installationDate', installationDate);
      formData.append('warrantyExpiry', warrantyExpiry);
      formData.append('condition', condition);
      formData.append('maintenanceSchedule', maintenanceSchedule);
      formData.append('lastMaintenanceDate', lastMaintenanceDate);
      formData.append('nextMaintenanceDate', nextMaintenanceDate);
      formData.append('contactName', contactName);
      formData.append('contactEmail', contactEmail);
      formData.append('contactPhone', contactPhone);
      formData.append('contactCompany', contactCompany);
      
      console.log('Submitting contact data:', {
        contactName,
        contactEmail,
        contactPhone,
        contactCompany
      });
      
      await updateBuildingSystem(system.id, formData);
      
      toast({
        title: 'System updated',
        description: 'The building system has been updated successfully.',
        variant: 'success',
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error updating system:', error);
      toast({
        title: 'Failed to update system',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!system) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Edit Building System</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the details for this building system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="systemType" className="text-gray-300 mb-2 block">
                  System Type *
                </Label>
                <Select value={systemType} onValueChange={setSystemType} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select system type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {systemTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name" className="text-gray-300 mb-2 block">
                  System Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main HVAC Unit"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manufacturer" className="text-gray-300 mb-2 block">
                  Manufacturer
                </Label>
                <Input
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g., Carrier"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="model" className="text-gray-300 mb-2 block">
                  Model
                </Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., 50TCQ400"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="installationDate" className="text-gray-300 mb-2 block">
                  Installation Date *
                </Label>
                <Input
                  id="installationDate"
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="warrantyExpiry" className="text-gray-300 mb-2 block">
                  Warranty Expiry
                </Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={warrantyExpiry}
                  onChange={(e) => setWarrantyExpiry(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition" className="text-gray-300 mb-2 block">
                  Condition *
                </Label>
                <Select value={condition} onValueChange={setCondition} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {conditionOptions.map((cond) => (
                      <SelectItem key={cond} value={cond} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maintenanceSchedule" className="text-gray-300 mb-2 block">
                  Maintenance Schedule *
                </Label>
                <Select value={maintenanceSchedule} onValueChange={setMaintenanceSchedule} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {maintenanceScheduleOptions.map((schedule) => (
                      <SelectItem key={schedule} value={schedule} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {schedule.replace('_', ' ').charAt(0).toUpperCase() + schedule.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastMaintenanceDate" className="text-gray-300 mb-2 block">
                  Last Maintenance Date
                </Label>
                <Input
                  id="lastMaintenanceDate"
                  type="date"
                  value={lastMaintenanceDate}
                  onChange={(e) => setLastMaintenanceDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="nextMaintenanceDate" className="text-gray-300 mb-2 block">
                  Next Maintenance Date
                </Label>
                <Input
                  id="nextMaintenanceDate"
                  type="date"
                  value={nextMaintenanceDate}
                  onChange={(e) => setNextMaintenanceDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Maintenance Contact Information */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Maintenance Contact Information</h3>
              <p className="text-sm text-gray-400 mb-4">Contact details for maintenance reminders via email and SMS</p>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName" className="text-gray-300 mb-2 block">
                      Contact Name
                    </Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g., John Smith"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactCompany" className="text-gray-300 mb-2 block">
                      Company
                    </Label>
                    <Input
                      id="contactCompany"
                      value={contactCompany}
                      onChange={(e) => setContactCompany(e.target.value)}
                      placeholder="e.g., ABC Maintenance Services"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail" className="text-gray-300 mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g., john@abcmaintenance.com"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactPhone" className="text-gray-300 mb-2 block">
                      Telephone Number
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
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
              {loading ? 'Updating...' : 'Update System'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 