'use client';

import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import ModalLayout from '../layout/ModalLayout';
import type { Vendor } from '@/types/users';

interface EditVendorModalProps {
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
  user: Vendor;
}

export default function EditVendorModal({ isOpen, onClose, onSave, user }: EditVendorModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    company: user.company,
    permissions: user.permissions,
    services: user.services,
    customServices: user.customServices,
    insurance: user.insurance,
    contractNumber: user.contractNumber,
    status: user.status
  });

  const [newService, setNewService] = useState('');

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      company: user.company,
      permissions: user.permissions,
      services: user.services,
      customServices: user.customServices,
      insurance: user.insurance,
      contractNumber: user.contractNumber,
      status: user.status
    });
  }, [user]);

  const handlePermissionChange = (area: string, access: 'none' | 'view' | 'edit' | 'admin') => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.area === area ? { ...p, access } : p
      ),
    }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const addCustomService = () => {
    if (newService.trim() && !formData.customServices.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        customServices: [...prev.customServices, newService.trim()],
      }));
      setNewService('');
    }
  };

  const removeCustomService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      customServices: prev.customServices.filter(s => s !== service),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const serviceCategories = [
    'Electrical',
    'Plumbing',
    'HVAC',
    'Carpentry',
    'Painting',
    'Landscaping',
    'Cleaning',
    'Security',
    'IT Services',
    'General Maintenance',
  ];

  return (
    <ModalLayout
      title="Edit Vendor"
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-vendor-form"
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
        </>
      }
    >
      <form id="edit-vendor-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
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
              Phone Number
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Services Offered</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {serviceCategories.map((service) => (
                <label
                  key={service}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Custom Services</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    placeholder="Add custom service"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
                  />
                  <button
                    type="button"
                    onClick={addCustomService}
                    className="px-3 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.customServices.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-1"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => removeCustomService(service)}
                        className="hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Insurance Information</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={formData.insurance.liability}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, liability: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span>Liability Insurance</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={formData.insurance.workersComp}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, workersComp: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span>Workers Compensation</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={formData.insurance.auto}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, auto: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span>Auto Insurance</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={formData.insurance.umbrella}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, umbrella: e.target.checked }
                }))}
                className="rounded border-gray-300 text-[#1a73e8] focus:ring-[#1a73e8]"
              />
              <span>Umbrella Insurance</span>
            </label>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">System Access Permissions</h3>
          <div className="space-y-3">
            {formData.permissions.map(({ area, access }) => (
              <div key={area} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {area}
                </span>
                <select
                  value={access}
                  onChange={(e) => handlePermissionChange(area, e.target.value as 'none' | 'view' | 'edit' | 'admin')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
                >
                  <option value="none">No Access</option>
                  <option value="view">View Only</option>
                  <option value="edit">Edit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </form>
    </ModalLayout>
  );
} 