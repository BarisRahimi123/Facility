'use client';

import { useState, useEffect } from 'react';
import ModalLayout from '../layout/ModalLayout';
import type { ExternalUser } from '@/types/users';

interface EditObserverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (observerData: {
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    permissions: Array<{
      area: string;
      access: 'none' | 'view' | 'edit' | 'admin';
    }>;
    projectAccess: string[];
    status: 'active' | 'inactive' | 'pending';
  }) => void;
  user: ExternalUser;
}

export default function EditObserverModal({ isOpen, onClose, onSave, user }: EditObserverModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    company: user.company,
    role: user.role,
    permissions: user.permissions,
    projectAccess: user.projectAccess,
    status: user.status,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        company: user.company,
        role: user.role,
        permissions: user.permissions,
        projectAccess: user.projectAccess,
        status: user.status,
      });
    }
  }, [user]);

  const handlePermissionChange = (area: string, access: 'none' | 'view' | 'edit' | 'admin') => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.area === area ? { ...p, access } : p
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <ModalLayout
      title="Edit Observer"
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
            form="edit-observer-form"
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
        </>
      }
    >
      <form id="edit-observer-form" onSubmit={handleSubmit} className="space-y-6">
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
              Role
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
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

        {/* Project Access */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Project Access</h3>
          <div className="space-y-2">
            {formData.projectAccess.map((project) => (
              <div key={project} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{project}</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    projectAccess: prev.projectAccess.filter(p => p !== project)
                  }))}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </ModalLayout>
  );
} 