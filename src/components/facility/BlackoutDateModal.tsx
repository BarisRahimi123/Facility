'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Ban, Repeat, Save, Trash2, X } from 'lucide-react';
import { Field, FieldBlackoutDate, RecurringPattern } from '@/types/field';
import { useToast } from '@/components/ui/use-toast';

interface BlackoutDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blackoutData: Partial<FieldBlackoutDate>) => void;
  onDelete?: (blackoutId: string) => void;
  field: Field | null;
  selectedDate: Date | null;
  blackoutDate?: FieldBlackoutDate | null;
}

export function BlackoutDateModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  field,
  selectedDate,
  blackoutDate
}: BlackoutDateModalProps) {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
    recurring: false,
    recurring_pattern: '',
    all_day: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (blackoutDate) {
        // Editing existing blackout
        setFormData({
          start_date: blackoutDate.start_date,
          end_date: blackoutDate.end_date,
          start_time: blackoutDate.start_time || '',
          end_time: blackoutDate.end_time || '',
          reason: blackoutDate.reason,
          recurring: blackoutDate.recurring,
          recurring_pattern: blackoutDate.recurring_pattern || '',
          all_day: !blackoutDate.start_time
        });
      } else if (selectedDate) {
        // Creating new blackout
        const dateStr = selectedDate.toISOString().split('T')[0];
        setFormData({
          start_date: dateStr,
          end_date: dateStr,
          start_time: '09:00',
          end_time: '17:00',
          reason: '',
          recurring: false,
          recurring_pattern: '',
          all_day: true
        });
      }
    }
  }, [isOpen, blackoutDate, selectedDate]);

  const handleSubmit = async () => {
    if (!field || !formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.all_day && formData.start_time && formData.end_time) {
      if (formData.end_time <= formData.start_time) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const blackoutData: Partial<FieldBlackoutDate> = {
        field_id: field.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
        recurring: formData.recurring,
        recurring_pattern: formData.recurring ? formData.recurring_pattern as RecurringPattern : undefined,
        start_time: formData.all_day ? undefined : formData.start_time,
        end_time: formData.all_day ? undefined : formData.end_time
      };

      await onSave(blackoutData);
      
      toast({
        title: blackoutDate ? "Blackout updated" : "Blackout created",
        description: `Field availability has been ${blackoutDate ? 'updated' : 'blocked'} successfully.`,
      });

      onClose();
    } catch (error) {
      console.error('Error saving blackout:', error);
      toast({
        title: "Failed to save blackout",
        description: "There was an error saving the blackout period. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!blackoutDate || !onDelete) return;

    setIsSubmitting(true);
    
    try {
      await onDelete(blackoutDate.id);
      
      toast({
        title: "Blackout deleted",
        description: "The blackout period has been removed successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Error deleting blackout:', error);
      toast({
        title: "Failed to delete blackout",
        description: "There was an error deleting the blackout period. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            {blackoutDate ? 'Edit Blackout Period' : 'Block Field Availability'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Field and Date Info */}
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">{field?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {field?.type} • ${field?.hourly_rate}/hour
                  </p>
                </div>
                {selectedDate && (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{formatDate(selectedDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-card-foreground">Date Range</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-muted-foreground">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date" className="text-muted-foreground">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground">Time Settings</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="all_day" className="text-muted-foreground">All Day</Label>
                  <Switch
                    id="all_day"
                    checked={formData.all_day}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: checked }))}
                  />
                </div>
              </div>

              {!formData.all_day && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time" className="text-muted-foreground">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_time" className="text-muted-foreground">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reason */}
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-card-foreground">Reason for Blackout</h3>
              
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-muted-foreground">Reason *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter reason for blocking this field (e.g., Maintenance, Private Event, Weather, etc.)"
                  className="bg-input border-border text-foreground"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recurring Settings */}
          <Card className="bg-card/60 border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-primary" />
                  Recurring Blackout
                </h3>
                <Switch
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: checked }))}
                />
              </div>

              {formData.recurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurring_pattern" className="text-muted-foreground">Recurrence Pattern</Label>
                  <Select 
                    value={formData.recurring_pattern} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_pattern: value }))}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This blackout will repeat according to the selected pattern
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          <div>
            {blackoutDate && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Blackout
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-border text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : (blackoutDate ? 'Update Blackout' : 'Create Blackout')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 