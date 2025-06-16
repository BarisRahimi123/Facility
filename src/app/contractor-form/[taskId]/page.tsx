'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { ServiceLineItem } from '@/types/maintenance';

interface ContractorFormPageProps {
  params: { taskId: string };
}

export default function ContractorFormPage({ params }: ContractorFormPageProps) {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('sid');
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<ServiceLineItem[]>([
    { description: '', quantity: 1, unit: 'hours', unitCost: 0 }
  ]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!submissionId) {
      setError('Invalid submission link. Please contact the facility manager.');
      setIsLoading(false);
      return;
    }
    loadTask();
  }, [submissionId]);

  const loadTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.taskId}?sid=${submissionId}`);
      if (!response.ok) {
        throw new Error('Failed to load task');
      }
      const data = await response.json();
      if (!data.task || data.task.submissionId !== submissionId) {
        throw new Error('Invalid submission link');
      }
      setTask(data.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit: 'hours', unitCost: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof ServiceLineItem, value: string | number) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setLineItems(newLineItems);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format line items
      const formattedLineItems = lineItems.map((item, index) => ({
        id: `${params.taskId}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitCost,
        totalPrice: item.quantity * item.unitCost,
      }));

      const estimateData = {
        submissionId,
        vendorId: 'plansrow', // This would come from authentication in a real app
        totalAmount: calculateTotal(),
        estimatedDuration: lineItems.reduce((total, item) => total + (item.quantity || 0), 0),
        availabilityDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: formattedLineItems,
        terms: 'Net 30',
        notes: notes || 'Estimate submitted via contractor form'
      };

      const response = await fetch(`/api/tasks/${params.taskId}/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(estimateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit estimate');
      }

      const data = await response.json();
      console.log('Estimate submitted successfully:', data);
      
      setIsSuccess(true);
    } catch (err) {
      console.error('Error submitting estimate:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Estimate Submitted Successfully!</h1>
          <p className="text-gray-600">
            Thank you for submitting your estimate. The facility manager will review it shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Submit Estimate</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {task && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-medium mb-2">{task.title}</h2>
          <p className="text-gray-600 text-sm">{task.description}</p>
          {task.systemType && (
            <div className="mt-2 text-sm">
              <span className="font-medium">System:</span> {task.systemType}
            </div>
          )}
          {task.location && (
            <div className="mt-1 text-sm">
              <span className="font-medium">Location:</span> {task.location}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Input
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  required
                />
              </div>
              <div className="w-24">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="w-24">
                <Label htmlFor={`unit-${index}`}>Unit</Label>
                <Input
                  id={`unit-${index}`}
                  value={item.unit}
                  onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                  required
                />
              </div>
              <div className="w-32">
                <Label htmlFor={`cost-${index}`}>Unit Cost</Label>
                <Input
                  id={`cost-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitCost}
                  onChange={(e) => handleLineItemChange(index, 'unitCost', parseFloat(e.target.value))}
                  required
                />
              </div>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => handleRemoveLineItem(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={handleAddLineItem}>
          <Plus className="w-4 h-4 mr-2" />
          Add Line Item
        </Button>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium">Total Amount:</span>
            <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Estimate'}
          </Button>
        </div>
      </form>
    </div>
  );
} 