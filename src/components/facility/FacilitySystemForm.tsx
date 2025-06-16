'use client';

import { useState } from 'react';
import { FacilitySystem, FacilitySystemFormData, SystemType, MaintenanceFrequency, SystemStatus } from '@/types/facility';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface FacilitySystemFormProps {
  initialData?: FacilitySystem;
  onSubmit: (data: FacilitySystemFormData) => void;
  onCancel: () => void;
}

const SYSTEM_TYPES: SystemType[] = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Fire Safety',
  'Security',
  'Elevator',
  'Building Automation',
  'Other'
];

const MAINTENANCE_FREQUENCIES: MaintenanceFrequency[] = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual'
];

const SYSTEM_STATUSES: SystemStatus[] = [
  'operational',
  'needs-maintenance',
  'under-maintenance',
  'offline',
  'critical'
];

export default function FacilitySystemForm({
  initialData,
  onSubmit,
  onCancel
}: FacilitySystemFormProps) {
  const [formData, setFormData] = useState<FacilitySystemFormData>(() => {
    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, maintenance_history, ...rest } = initialData;
      return rest;
    }
    return {
      type: 'HVAC',
      name: '',
      description: '',
      location: '',
      manufacturer: '',
      model_number: '',
      installation_date: new Date().toISOString().split('T')[0],
      maintenance_frequency: 'monthly',
      last_maintenance: new Date().toISOString().split('T')[0],
      next_maintenance: new Date().toISOString().split('T')[0],
      status: 'operational',
      responsible_personnel: [],
      specifications: {},
    };
  });

  const handleChange = <K extends keyof FacilitySystemFormData>(
    field: K,
    value: FacilitySystemFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">System Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: SystemType) => handleChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">System Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={e => handleChange('location', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={e => handleChange('manufacturer', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model_number">Model Number</Label>
          <Input
            id="model_number"
            value={formData.model_number}
            onChange={e => handleChange('model_number', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="installation_date">Installation Date</Label>
          <Input
            id="installation_date"
            type="date"
            value={formData.installation_date}
            onChange={e => handleChange('installation_date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance_frequency">Maintenance Frequency</Label>
          <Select
            value={formData.maintenance_frequency}
            onValueChange={(value: MaintenanceFrequency) => handleChange('maintenance_frequency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAINTENANCE_FREQUENCIES.map(frequency => (
                <SelectItem key={frequency} value={frequency}>
                  {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: SystemStatus) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update System' : 'Add System'}
        </Button>
      </div>
    </form>
  );
} 