'use client';

import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderItem, Vendor } from '@/types/maintenance';

interface PurchaseOrderFormProps {
  onSubmit: (data: Partial<PurchaseOrder>) => void;
  onCancel: () => void;
  vendors: Vendor[];
  initialData?: Partial<PurchaseOrder>;
  maintenanceId: string;
}

export default function PurchaseOrderForm({
  onSubmit,
  onCancel,
  vendors,
  initialData,
  maintenanceId,
}: PurchaseOrderFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      items,
      totalAmount: calculateTotal(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
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

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtotal
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
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

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500">
                Click to upload or drag and drop
              </span>
              <input type="file" multiple className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
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

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-lg font-medium text-gray-900">
          Total: ${calculateTotal().toFixed(2)}
        </div>
        <div className="flex gap-4">
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
            Create Purchase Order
          </button>
        </div>
      </div>
    </form>
  );
} 