'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { MaintenanceTask } from '@/types/maintenance';

interface MaintenanceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<MaintenanceTask>) => void;
  initialData?: Partial<MaintenanceTask>;
}

export default function MaintenanceTaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: MaintenanceTaskModalProps) {
  const [formData, setFormData] = useState<Partial<MaintenanceTask>>({
    title: '',
    description: '',
    type: 'preventive',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    estimatedDuration: 60,
    ...initialData,
  });

  const [assignees, setAssignees] = useState<Array<{
    id?: string;
    email?: string;
    phone?: string;
    role: 'assignee' | 'observer';
  }>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
    });
  };

  const handleAddAssignee = () => {
    setAssignees([...assignees, { role: 'assignee' }]);
  };

  const handleRemoveAssignee = (index: number) => {
    setAssignees(assignees.filter((_, i) => i !== index));
  };

  const handleAssigneeChange = (index: number, updates: Partial<typeof assignees[0]>) => {
    setAssignees(assignees.map((assignee, i) => 
      i === index ? { ...assignee, ...updates } : assignee
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as MaintenanceTask['type'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value as MaintenanceTask['priority'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
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

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 h-32 resize-none"
                placeholder="Enter task description..."
              />
            </div>
          </div>

          {/* Assignments Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Assignments</h3>
              <button
                type="button"
                onClick={handleAddAssignee}
                className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Add Assignee
              </button>
            </div>

            <div className="space-y-4">
              {assignees.map((assignee, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={assignee.email || ''}
                      onChange={(e) =>
                        handleAssigneeChange(index, { email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={assignee.phone || ''}
                      onChange={(e) =>
                        handleAssigneeChange(index, { phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={assignee.role}
                      onChange={(e) =>
                        handleAssigneeChange(index, { role: e.target.value as 'assignee' | 'observer' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="assignee">Assignee</option>
                      <option value="observer">Observer</option>
                    </select>
                  </div>

                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 