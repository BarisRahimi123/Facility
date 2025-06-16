'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, AlertTriangle } from 'lucide-react';

export interface MaintenanceFormData {
  type: string;
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  assignedTo: string;
  estimatedDuration: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface MaintenanceFormProps {
  onSubmit: (data: MaintenanceFormData) => void;
  onCancel: () => void;
  initialData?: Partial<MaintenanceFormData>;
}

const maintenanceTypes = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Structural',
  'Fire Safety',
  'Security Systems',
  'Cleaning',
  'Landscaping',
  'General',
];

const frequencies = [
  { value: 'one-time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

export default function MaintenanceForm({ onSubmit, onCancel, initialData }: MaintenanceFormProps) {
  const [formData, setFormData] = useState<MaintenanceFormData>({
    type: initialData?.type || '',
    frequency: initialData?.frequency || 'one-time',
    priority: initialData?.priority || 'medium',
    description: initialData?.description || '',
    assignedTo: initialData?.assignedTo || '',
    estimatedDuration: initialData?.estimatedDuration || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const showEndDate = formData.frequency !== 'one-time';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            <option value="">Select type</option>
            {maintenanceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value as MaintenanceFormData['frequency'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            {frequencies.map((freq) => (
              <option key={freq.value} value={freq.value}>
                {freq.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <div className="flex gap-4">
          {priorities.map((priority) => (
            <label
              key={priority.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
                formData.priority === priority.value
                  ? priority.color
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={priority.value}
                checked={formData.priority === priority.value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as MaintenanceFormData['priority'],
                  }))
                }
                className="hidden"
              />
              {priority.value === 'critical' && (
                <AlertTriangle className="w-4 h-4" />
              )}
              {priority.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 h-32 resize-none"
          placeholder="Describe the maintenance work required..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Assigned To
            </div>
          </label>
          <input
            type="text"
            value={formData.assignedTo}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter name or team"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Estimated Duration
            </div>
          </label>
          <input
            type="text"
            value={formData.estimatedDuration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                estimatedDuration: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., 2 hours, 1 day"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date
            </div>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {showEndDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </div>
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              required={showEndDate}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
          placeholder="Any additional notes or requirements..."
        />
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Schedule Maintenance
        </button>
      </div>
    </form>
  );
} 