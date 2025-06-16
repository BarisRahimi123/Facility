'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderAssignment, Vendor } from '@/types/maintenance';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PurchaseOrder>) => void;
  vendors: Vendor[];
  initialData?: Partial<PurchaseOrder>;
  maintenanceId: string;
}

export default function PurchaseOrderModal({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  initialData,
  maintenanceId,
}: PurchaseOrderModalProps) {
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({
    maintenanceId,
    status: 'draft',
    items: [],
    totalAmount: 0,
    requestDate: new Date().toISOString().split('T')[0],
    ...initialData,
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>(
    initialData?.items || []
  );

  const [assignees, setAssignees] = useState<PurchaseOrderAssignment[]>([]);

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      unit: 'piece',
      subtotal: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<PurchaseOrderItem>) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          updatedItem.subtotal = updatedItem.quantity * updatedItem.unitPrice;
          return updatedItem;
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      items,
      totalAmount: calculateTotal(),
      assignments: assignees,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Purchase Order' : 'Create Purchase Order'}
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
                Vendor
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, vendorId: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expectedDeliveryDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, { description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, { quantity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.id, { unitPrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(item.id, { unit: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtotal
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500">
                      ${item.subtotal.toFixed(2)}
                    </div>
                  </div>

                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
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
                <Plus className="w-4 h-4 inline mr-1" />
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
                        handleAssigneeChange(index, { role: e.target.value as 'assignee' | 'approver' | 'observer' })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="assignee">Assignee</option>
                      <option value="approver">Approver</option>
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

          {/* Notes */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 h-24 resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-lg font-medium text-gray-900">
              Total: ${calculateTotal().toFixed(2)}
            </div>
            <div className="flex gap-4">
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
                {initialData ? 'Update Purchase Order' : 'Create Purchase Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 