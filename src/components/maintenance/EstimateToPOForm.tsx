'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { VendorEstimate, PurchaseOrder, PurchaseOrderAssignment } from '@/types/maintenance';

interface EstimateToPOFormProps {
  estimate: VendorEstimate;
  onSubmit: (data: Partial<PurchaseOrder>) => void;
  onCancel: () => void;
}

export default function EstimateToPOForm({
  estimate,
  onSubmit,
  onCancel,
}: EstimateToPOFormProps) {
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    estimateId: estimate.id,
    vendorId: estimate.vendorId,
    status: 'draft',
    items: estimate.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      notes: item.notes
    })),
    totalAmount: estimate.totalAmount,
    requestDate: new Date().toISOString().split('T')[0],
    paymentTerms: estimate.terms,
    notes: estimate.notes,
  });

  const [assignments, setAssignments] = useState<PurchaseOrderAssignment[]>([
    { role: 'approver' },
    { role: 'observer' }
  ]);

  const handleAssignmentChange = (index: number, field: string, value: string) => {
    setAssignments(prev => prev.map((assignment, i) => 
      i === index ? { ...assignment, [field]: value } : assignment
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      assignments,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Estimate Details</h3>
          <Badge variant={estimate.status === 'accepted' ? 'success' : 'warning'}>
            {estimate.status === 'accepted' ? (
              <CheckCircle2 className="w-4 h-4 mr-1" />
            ) : (
              <Clock className="w-4 h-4 mr-1" />
            )}
            {estimate.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Total Amount</Label>
            <div className="text-lg font-semibold">${estimate.totalAmount.toFixed(2)}</div>
          </div>
          <div>
            <Label>Estimated Duration</Label>
            <div className="text-lg">{estimate.estimatedDuration} hours</div>
          </div>
        </div>

        <div className="mb-4">
          <Label>Line Items</Label>
          <Card className="mt-2">
            <div className="divide-y">
              {estimate.lineItems.map((item, index) => (
                <div key={item.id} className="p-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{item.description}</span>
                    <span className="text-gray-600">${item.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
                  </div>
                  {item.notes && (
                    <div className="text-sm text-gray-500 mt-1">{item.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Purchase Order Details</h3>
        
        <div>
          <Label>PO Number</Label>
          <Input
            value={formData.poNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, poNumber: e.target.value }))}
            placeholder="Enter PO number"
            required
          />
        </div>

        <div>
          <Label>Payment Terms</Label>
          <Input
            value={formData.paymentTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
            placeholder="Enter payment terms"
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes..."
            className="h-24"
          />
        </div>

        <div className="space-y-3">
          <Label>Assignments</Label>
          {assignments.map((assignment, index) => (
            <div key={index} className="grid grid-cols-3 gap-2">
              <Input
                value={assignment.email || ''}
                onChange={(e) => handleAssignmentChange(index, 'email', e.target.value)}
                placeholder="Email"
              />
              <Input
                value={assignment.phone || ''}
                onChange={(e) => handleAssignmentChange(index, 'phone', e.target.value)}
                placeholder="Phone (optional)"
              />
              <select
                value={assignment.role}
                onChange={(e) => handleAssignmentChange(index, 'role', e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="approver">Approver</option>
                <option value="observer">Observer</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Purchase Order
        </Button>
      </div>
    </form>
  );
} 