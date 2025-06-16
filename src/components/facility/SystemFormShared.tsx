'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { FacilitySystemFormData, SystemType, MaintenanceFrequency, SystemStatus } from '@/types/facility';

interface SystemFormSharedProps {
  onSubmit: (data: FacilitySystemFormData) => void;
  initialData?: Partial<FacilitySystemFormData>;
  isSubmitting?: boolean;
}

const SYSTEM_TYPES: SystemType[] = [
  'HVAC', 'Electrical', 'Plumbing', 'Fire Safety',
  'Security', 'Elevator', 'Building Automation', 'Other'
];

const FREQUENCIES: MaintenanceFrequency[] = [
  'daily', 'weekly', 'biweekly', 'monthly',
  'quarterly', 'semiannual', 'annual'
];

const STATUSES: SystemStatus[] = [
  'operational', 'needs-maintenance', 'under-maintenance',
  'offline', 'critical'
];

export default function SystemFormShared({
  onSubmit,
  initialData,
  isSubmitting = false
}: SystemFormSharedProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FacilitySystemFormData>>({
    ...initialData
  });

  const steps = [
    {
      title: "What type of system is this?",
      field: "type",
      component: (
        <div className="space-y-4">
          {SYSTEM_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setFormData(prev => ({ ...prev, type }));
                setCurrentStep(prev => prev + 1);
              }}
              className={`w-full p-4 text-left rounded-lg transition-all ${
                formData.type === type
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              } border`}
              disabled={isSubmitting}
            >
              {type}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Tell us about this system",
      field: "basicInfo",
      component: (
        <div className="space-y-6">
          <input
            type="text"
            placeholder="System Name"
            value={formData.name || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <textarea
            placeholder="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32"
            disabled={isSubmitting}
          />
          <input
            type="text"
            placeholder="Location"
            value={formData.location || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!formData.name || !formData.description || !formData.location || isSubmitting}
            className="w-full p-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </div>
      )
    },
    {
      title: "Manufacturer Details",
      field: "manufacturerInfo",
      component: (
        <div className="space-y-6">
          <input
            type="text"
            placeholder="Manufacturer"
            value={formData.manufacturer || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <input
            type="text"
            placeholder="Model Number"
            value={formData.model_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, model_number: e.target.value }))}
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <input
            type="text"
            placeholder="Serial Number (Optional)"
            value={formData.serial_number || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
            className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!formData.manufacturer || !formData.model_number || isSubmitting}
            className="w-full p-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </div>
      )
    },
    {
      title: "Maintenance Schedule",
      field: "maintenanceInfo",
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Installation Date
            </label>
            <input
              type="date"
              value={formData.installation_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, installation_date: e.target.value }))}
              className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Warranty Expiration (Optional)
            </label>
            <input
              type="date"
              value={formData.warranty_expiration || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, warranty_expiration: e.target.value }))}
              className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Maintenance Frequency
            </label>
            <select
              value={formData.maintenance_frequency || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, maintenance_frequency: e.target.value as MaintenanceFrequency }))}
              className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select Frequency</option>
              {FREQUENCIES.map(freq => (
                <option key={freq} value={freq}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!formData.installation_date || !formData.maintenance_frequency || isSubmitting}
            className="w-full p-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </div>
      )
    },
    {
      title: "Additional Information",
      field: "additionalInfo",
      component: (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Current Status
            </label>
            <select
              value={formData.status || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SystemStatus }))}
              className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Select Status</option>
              {STATUSES.map(status => (
                <option key={status} value={status}>
                  {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Responsible Personnel (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. John Smith, Jane Doe"
              value={formData.responsible_personnel?.join(', ') || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                responsible_personnel: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
              }))}
              className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any additional notes..."
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-4 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32"
              disabled={isSubmitting}
            />
          </div>
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!formData.status || !formData.responsible_personnel?.length || isSubmitting}
            className="w-full p-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Review
          </button>
        </div>
      )
    },
    {
      title: "Review & Submit",
      field: "review",
      component: (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="font-medium text-lg">System Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div>{formData.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div>{formData.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div>{formData.location}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div>{formData.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Manufacturer</div>
                <div>{formData.manufacturer}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Model Number</div>
                <div>{formData.model_number}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Installation Date</div>
                <div>{formData.installation_date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Maintenance Frequency</div>
                <div>{formData.maintenance_frequency}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Description</div>
              <div className="mt-1">{formData.description}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Responsible Personnel</div>
              <div className="mt-1">{formData.responsible_personnel?.join(', ')}</div>
            </div>
            {formData.notes && (
              <div>
                <div className="text-sm text-gray-500">Notes</div>
                <div className="mt-1">{formData.notes}</div>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={isSubmitting}
              className="flex-1 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={() => onSubmit(formData as FacilitySystemFormData)}
              disabled={isSubmitting}
              className="flex-1 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">{steps[currentStep].title}</h2>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>
      </div>
      {currentStep > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            disabled={isSubmitting}
          >
            <ChevronUp className="w-4 h-4" />
            Back to previous step
          </button>
        </div>
      )}
    </div>
  );
} 