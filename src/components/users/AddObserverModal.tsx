'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import ModalLayout from '../layout/ModalLayout';

interface Permission {
  area: string;
  access: 'none' | 'view' | 'edit';
}

export interface AddObserverModalProps {
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
}

export default function AddObserverModal({ isOpen, onClose, onSave }: AddObserverModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    permissions: [
      { area: 'plans', access: 'none' as const },
      { area: 'tasks', access: 'none' as const },
      { area: 'photos', access: 'none' as const },
      { area: 'forms', access: 'none' as const }
    ] as Array<{ area: string; access: 'none' | 'view' | 'edit' | 'admin' }>,
    projectAccess: [] as string[],
    status: 'pending' as 'active' | 'inactive' | 'pending'
  });

  const [newProject, setNewProject] = useState('');

  const handlePermissionChange = (area: string, access: 'none' | 'view' | 'edit' | 'admin') => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.area === area ? { ...p, access } : p
      )
    }));
  };

  const handleAddProject = () => {
    if (newProject.trim() && !formData.projectAccess.includes(newProject.trim())) {
      setFormData(prev => ({
        ...prev,
        projectAccess: [...prev.projectAccess, newProject.trim()]
      }));
      setNewProject('');
    }
  };

  const removeProject = (project: string) => {
    setFormData(prev => ({
      ...prev,
      projectAccess: prev.projectAccess.filter(p => p !== project)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalLayout
      title="Add External Observer"
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
            form="add-observer-form"
            className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          >
            Add Observer
          </button>
        </>
      }
    >
      <form id="add-observer-form" onSubmit={handleSubmit} className="space-y-6">
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
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Permissions</h3>
          <div className="space-y-3">
            {formData.permissions.map((permission) => (
              <div key={permission.area} className="flex items-center justify-between">
                <span className="text-sm capitalize">{permission.area}</span>
                <select
                  value={permission.access}
                  onChange={(e) => handlePermissionChange(permission.area, e.target.value as 'none' | 'view' | 'edit' | 'admin')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
                >
                  <option value="none">No Access</option>
                  <option value="view">View Only</option>
                  <option value="edit">Edit Access</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Project Access */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Project Access</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="Enter project name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
              />
              <button
                type="button"
                onClick={handleAddProject}
                className="px-3 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.projectAccess.map((project) => (
                <span
                  key={project}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm flex items-center gap-1"
                >
                  {project}
                  <button
                    type="button"
                    onClick={() => removeProject(project)}
                    className="hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </form>
    </ModalLayout>
  );
} 