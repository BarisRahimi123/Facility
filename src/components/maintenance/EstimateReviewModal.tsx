import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import type { MaintenanceTask, Vendor, VendorEstimate } from '@/types/maintenance';

interface EstimateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask;
  vendors: Vendor[];
  onAcceptEstimate: (estimate: VendorEstimate) => void;
  onCreatePO?: (estimate: VendorEstimate) => void;
}

// Mock estimates for demo - in real app, these would come from the backend
const mockEstimates: VendorEstimate[] = [
  {
    id: '1',
    rfqId: 'rfq1',
    vendorId: '1',
    status: 'submitted',
    totalAmount: 2500,
    estimatedDuration: 16,
    availabilityDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [
      {
        id: '1',
        description: 'Labor - HVAC Repair',
        quantity: 8,
        unit: 'hours',
        unitPrice: 125,
        totalPrice: 1000,
      },
      {
        id: '2',
        description: 'Replacement Parts',
        quantity: 1,
        unit: 'set',
        unitPrice: 1500,
        totalPrice: 1500,
      },
    ],
    submittedAt: new Date().toISOString(),
  },
  {
    id: '2',
    rfqId: 'rfq1',
    vendorId: '2',
    status: 'submitted',
    totalAmount: 2800,
    estimatedDuration: 24,
    availabilityDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [
      {
        id: '1',
        description: 'Labor - HVAC Service',
        quantity: 12,
        unit: 'hours',
        unitPrice: 150,
        totalPrice: 1800,
      },
      {
        id: '2',
        description: 'Parts and Materials',
        quantity: 1,
        unit: 'set',
        unitPrice: 1000,
        totalPrice: 1000,
      },
    ],
    submittedAt: new Date().toISOString(),
  },
];

export default function EstimateReviewModal({
  isOpen,
  onClose,
  task,
  vendors,
  onAcceptEstimate,
  onCreatePO,
}: EstimateReviewModalProps) {
  const [selectedEstimate, setSelectedEstimate] = useState<string | null>(null);

  // Get all estimates from all RFQs
  const allEstimates = task.requestForQuotes?.flatMap(rfq => rfq.estimates || []) || [];

  const handleAccept = () => {
    const estimate = allEstimates.find(e => e.id === selectedEstimate);
    if (estimate) {
      const updatedEstimate = {
        ...estimate,
        status: 'accepted' as const
      };
      onAcceptEstimate(updatedEstimate);
    }
  };

  const handleCreatePO = () => {
    const estimate = allEstimates.find(e => e.id === selectedEstimate);
    if (estimate && onCreatePO) {
      onCreatePO(estimate);
    }
  };

  const getStatusBadge = (status: VendorEstimate['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>;
      case 'submitted':
        return <Badge variant="secondary"><AlertTriangle className="w-4 h-4 mr-1" /> Submitted</Badge>;
      case 'accepted':
        return <Badge variant="success"><CheckCircle2 className="w-4 h-4 mr-1" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="w-4 h-4 mr-1" /> Rejected</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Review Estimates</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {allEstimates.map(estimate => {
              const vendor = vendors.find(v => v.id === estimate.vendorId);
              return (
                <Card
                  key={estimate.id}
                  className={`p-4 cursor-pointer ${
                    selectedEstimate === estimate.id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedEstimate(estimate.id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">{vendor?.name}</h3>
                      <div className="mt-1">
                        {getStatusBadge(estimate.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Available: {new Date(estimate.availabilityDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        ${estimate.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {estimate.estimatedDuration} hours
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {estimate.lineItems.map(item => (
                      <div key={item.id} className="text-sm flex justify-between">
                        <span>
                          {item.description} ({item.quantity} {item.unit})
                        </span>
                        <span>${item.totalPrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm">
                      <div>Rating: {vendor?.rating} / 5</div>
                      <div>Specialties: {vendor?.specialties.join(', ')}</div>
                      {estimate.notes && (
                        <div className="mt-2">
                          <strong>Notes:</strong>
                          <p className="text-gray-600">{estimate.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {task.workflowStatus === 'estimates_received' && (
              <Button
                onClick={handleAccept}
                disabled={!selectedEstimate}
              >
                Accept Estimate
              </Button>
            )}
            {task.workflowStatus === 'estimate_accepted' && onCreatePO && (
              <Button
                onClick={handleCreatePO}
                disabled={!selectedEstimate}
              >
                Create PO
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 