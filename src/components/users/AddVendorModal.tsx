'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import ModalLayout from '../layout/ModalLayout';

interface Permission {
  area: string;
  access: 'none' | 'view' | 'edit';
}

interface Insurance {
  provider: string;
  policyNumber: string;
  expiryDate: string;
}

export interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendorData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    services: string[];
    customServices: string[];
    insurance: {
      liability: boolean;
      workersComp: boolean;
      auto: boolean;
      umbrella: boolean;
    };
    permissions: Array<{
      area: string;
      access: 'none' | 'view' | 'edit' | 'admin';
    }>;
    contractNumber: string;
    status: 'active' | 'inactive' | 'pending';
  }) => void;
}

export default function AddVendorModal({ isOpen, onClose, onSave }: AddVendorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    services: [] as string[],
    customServices: [] as string[],
    insurance: {
      liability: false,
      workersComp: false,
      auto: false,
      umbrella: false
    },
    permissions: [
      { area: 'plans', access: 'none' as const },
      { area: 'tasks', access: 'none' as const },
      { area: 'photos', access: 'none' as const },
      { area: 'forms', access: 'none' as const }
    ] as Array<{ area: string; access: 'none' | 'view' | 'edit' | 'admin' }>,
    contractNumber: '',
    status: 'pending' as 'active' | 'inactive' | 'pending'
  });

  const [newService, setNewService] = useState('');

  const handlePermissionChange = (area: string, access: 'none' | 'view' | 'edit' | 'admin') => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.area === area ? { ...p, access } : p
      )
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const addCustomService = () => {
    if (newService.trim() && !formData.customServices.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        customServices: [...prev.customServices, newService.trim()]
      }));
      setNewService('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalLayout
      title="Add New Vendor"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[#E0E0E0] rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-vendor-form"
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          >
            Add Vendor
          </button>
        </>
      }
    >
      <form id="add-vendor-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
        </div>

        {/* Insurance Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Insurance Coverage
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.insurance.liability}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, liability: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span className="ml-2 text-sm">Liability Insurance</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.insurance.workersComp}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, workersComp: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span className="ml-2 text-sm">Workers Compensation</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.insurance.auto}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, auto: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span className="ml-2 text-sm">Auto Insurance</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.insurance.umbrella}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, umbrella: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span className="ml-2 text-sm">Umbrella Coverage</span>
            </label>
          </div>
        </div>

        {/* Contract Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Number
          </label>
          <input
            type="text"
            required
            value={formData.contractNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              status: e.target.value as 'active' | 'inactive' | 'pending'
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
          >
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </ModalLayout>
  );
} 