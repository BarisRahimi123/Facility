import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { MaintenanceTask, Vendor } from '@/types/maintenance';

interface RequestForQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask;
  vendors: Vendor[];
  onSubmit: (data: {
    vendorIds: string[];
    dueDate: string;
    scope: string;
    notes: string;
  }) => void;
}

export default function RequestForQuoteModal({
  isOpen,
  onClose,
  task,
  vendors,
  onSubmit,
}: RequestForQuoteModalProps) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [scope, setScope] = useState(task.description || '');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      vendorIds: selectedVendors,
      dueDate,
      scope,
      notes,
    });
  };

  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendors(prev => {
      if (prev.includes(vendorId)) {
        return prev.filter(id => id !== vendorId);
      }
      return [...prev, vendorId];
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Request for Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Vendors
            </label>
            <div className="grid grid-cols-2 gap-2">
              {vendors.map(vendor => (
                <div
                  key={vendor.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedVendors.includes(vendor.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleVendorSelect(vendor.id)}
                >
                  <div className="font-medium">{vendor.name}</div>
                  <div className="text-sm text-gray-500">
                    Rating: {vendor.rating}/5
                  </div>
                  <div className="text-sm text-gray-500">
                    Specialties: {vendor.specialties.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Scope of Work
            </label>
            <Textarea
              value={scope}
              onChange={e => setScope(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Additional Notes
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific requirements or preferences..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={selectedVendors.length === 0 || !dueDate || !scope}
            >
              Send RFQ
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 