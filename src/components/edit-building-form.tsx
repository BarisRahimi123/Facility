'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building } from '@/types/building';

interface EditBuildingFormProps {
  building: Building;
  onClose: () => void;
  onSave: (data: Building) => void;
}

export function EditBuildingForm({ building, onClose, onSave }: EditBuildingFormProps) {
  const [formData, setFormData] = useState({
    name: building.name || '',
    building_type: building.building_type || '',
    square_footage: building.square_footage || 0,
    construction_date: building.construction_date || '',
    status: building.status || 'active',
    notes: building.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...building, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Building Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="building_type">Building Type</Label>
        <Select value={formData.building_type} onValueChange={(value) => setFormData(prev => ({ ...prev, building_type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Administration">Administration</SelectItem>
            <SelectItem value="Classroom">Classroom</SelectItem>
            <SelectItem value="Laboratory">Laboratory</SelectItem>
            <SelectItem value="Office">Office</SelectItem>
            <SelectItem value="Warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="square_footage">Square Footage</Label>
        <Input
          id="square_footage"
          type="number"
          value={formData.square_footage}
          onChange={(e) => setFormData(prev => ({ ...prev, square_footage: parseInt(e.target.value) || 0 }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="construction_date">Construction Date</Label>
        <Input
          id="construction_date"
          type="date"
          value={formData.construction_date}
          onChange={(e) => setFormData(prev => ({ ...prev, construction_date: e.target.value }))}
        />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
} 