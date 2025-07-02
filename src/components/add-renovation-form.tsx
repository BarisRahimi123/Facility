'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddRenovationFormProps {
  buildingId: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function AddRenovationForm({ buildingId, onClose, onSave }: AddRenovationFormProps) {
  const [formData, setFormData] = useState({
    scope_of_work: '',
    square_footage_affected: 0,
    start_date: '',
    completion_date: '',
    estimated_budget: 0,
    status: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="scope_of_work">Scope of Work</Label>
        <Textarea
          id="scope_of_work"
          value={formData.scope_of_work}
          onChange={(e) => setFormData(prev => ({ ...prev, scope_of_work: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="square_footage_affected">Square Footage Affected</Label>
        <Input
          id="square_footage_affected"
          type="number"
          value={formData.square_footage_affected}
          onChange={(e) => setFormData(prev => ({ ...prev, square_footage_affected: parseInt(e.target.value) || 0 }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="start_date">Start Date</Label>
        <Input
          id="start_date"
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="completion_date">Completion Date</Label>
        <Input
          id="completion_date"
          type="date"
          value={formData.completion_date}
          onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="estimated_budget">Estimated Budget</Label>
        <Input
          id="estimated_budget"
          type="number"
          value={formData.estimated_budget}
          onChange={(e) => setFormData(prev => ({ ...prev, estimated_budget: parseInt(e.target.value) || 0 }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Planned">Planned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Save Renovation
        </Button>
      </div>
    </form>
  );
} 