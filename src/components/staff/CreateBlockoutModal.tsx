'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { createBlockout } from '@/app/actions/staff';
import type { FacilityWithFields, CreateBlockoutFormData } from '@/types/staff';
import { useToast } from '@/components/ui/use-toast';

interface CreateBlockoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facility: FacilityWithFields | null;
}

export default function CreateBlockoutModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  facility 
}: CreateBlockoutModalProps) {
  const [formData, setFormData] = useState<CreateBlockoutFormData>({
    field_id: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
    description: '',
    recurring: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.field_id || !formData.start_date || !formData.end_date || !formData.reason) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create the blockout data, excluding empty time fields
      const blockoutData: CreateBlockoutFormData = {
        field_id: formData.field_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        description: formData.description || undefined,
        recurring: formData.recurring
      };

      // Only include time fields if they're provided
      if (formData.start_time) {
        blockoutData.start_time = formData.start_time;
      }
      if (formData.end_time) {
        blockoutData.end_time = formData.end_time;
      }

      const response = await createBlockout(blockoutData);
      
      if (response.error) {
        toast({
          title: "Error creating blockout",
          description: response.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Blockout created successfully",
          description: `${formData.reason} has been added to the calendar`
        });
        
        // Reset form
        setFormData({
          field_id: '',
          start_date: '',
          end_date: '',
          start_time: '',
          end_time: '',
          reason: '',
          description: '',
          recurring: false
        });
        
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error creating blockout",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      field_id: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      reason: '',
      description: '',
      recurring: false
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Set today as minimum date
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Create Blockout
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Field Selection */}
          <div>
            <Label htmlFor="field" className="text-sm font-medium">
              Field <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.field_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, field_id: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a field to block" />
              </SelectTrigger>
              <SelectContent>
                {facility?.fields.map(field => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} - {field.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  start_date: e.target.value,
                  end_date: prev.end_date || e.target.value // Auto-set end date if empty
                }))}
                min={today}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date" className="text-sm font-medium">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                min={formData.start_date || today}
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Time Range (Optional) */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Time Range (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time" className="text-xs text-muted-foreground">
                  Start Time
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_time" className="text-xs text-muted-foreground">
                  End Time
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1"
                  min={formData.start_time}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to block the entire day
            </p>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.reason} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Renovation">Renovation</SelectItem>
                <SelectItem value="Weather">Weather</SelectItem>
                <SelectItem value="Private Event">Private Event</SelectItem>
                <SelectItem value="Staff Training">Staff Training</SelectItem>
                <SelectItem value="Equipment Issue">Equipment Issue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Additional details about the blockout..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Recurring (Future feature) */}
          <div className="flex items-center space-x-2 opacity-50">
            <Checkbox
              id="recurring"
              checked={formData.recurring}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                recurring: checked as boolean 
              }))}
              disabled // Disable for now
            />
            <Label htmlFor="recurring" className="text-sm text-muted-foreground">
              Recurring blockout (Coming Soon)
            </Label>
          </div>

          {/* Preview */}
          {formData.field_id && formData.start_date && formData.reason && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Blockout Preview
                </h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Field:</strong> {facility?.fields.find(f => f.id === formData.field_id)?.name}</p>
                  <p><strong>Date:</strong> {format(new Date(formData.start_date), 'MMM d, yyyy')}
                    {formData.end_date !== formData.start_date && formData.end_date && 
                      ` - ${format(new Date(formData.end_date), 'MMM d, yyyy')}`}
                  </p>
                  {formData.start_time && (
                    <p><strong>Time:</strong> {formData.start_time} - {formData.end_time || 'End of day'}</p>
                  )}
                  <p><strong>Reason:</strong> {formData.reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.field_id || !formData.start_date || !formData.reason}
            >
              {isSubmitting ? 'Creating...' : 'Create Blockout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}  