'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface POSettings {
  approvalWorkflow: {
    enabled: boolean;
    requiredApprovals: number;
    escalateAfterHours: number;
    approvers: string[];
  };
  notifications: {
    notifyVendor: boolean;
    notifyApprovers: boolean;
    notifyOnApproval: boolean;
    escalateAfterHours: number;
  };
  documentSettings: {
    requireAttachments: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
  termsAndConditions: {
    required: boolean;
    defaultTerms: string;
    allowCustomTerms: boolean;
  };
}

export default function POFormPreview() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<POSettings | null>(null);

  useEffect(() => {
    const settingsParam = searchParams.get('settings');
    if (settingsParam) {
      try {
        const decodedSettings = JSON.parse(decodeURIComponent(settingsParam));
        setSettings(decodedSettings);
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }, [searchParams]);

  if (!settings) {
    return <div className="p-6">Loading preview...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Purchase Order Form</h1>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">PO Number</label>
                <Input placeholder="PO-XXXX" disabled />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input type="date" disabled />
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Vendor Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vendor Name</label>
                <Input placeholder="Enter vendor name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <Input placeholder="Enter contact person" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Line Items</h2>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input placeholder="Item description" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Unit Price</label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Total</label>
                  <Input type="number" disabled placeholder="0.00" />
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">Add Line Item</Button>
          </div>

          {/* Attachments */}
          {settings.documentSettings.requireAttachments && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Attachments</h2>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">
                  Drop files here or click to upload<br />
                  Maximum file size: {settings.documentSettings.maxFileSize}MB<br />
                  Allowed types: {settings.documentSettings.allowedFileTypes.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          {settings.termsAndConditions.required && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Terms and Conditions</h2>
              {settings.termsAndConditions.allowCustomTerms ? (
                <Textarea 
                  placeholder="Enter terms and conditions"
                  rows={4}
                />
              ) : (
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm">{settings.termsAndConditions.defaultTerms || 'Default terms and conditions will be applied.'}</p>
                </div>
              )}
            </div>
          )}

          {/* Approval Section */}
          {settings.approvalWorkflow.enabled && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Approval Workflow</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm">
                  This PO requires {settings.approvalWorkflow.requiredApprovals} approval(s).<br />
                  Approvers will be notified and must respond within {settings.approvalWorkflow.escalateAfterHours} hours.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline">Save as Draft</Button>
            <Button>Submit for Approval</Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 