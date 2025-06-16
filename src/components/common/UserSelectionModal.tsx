'use client';

import { useState, useEffect } from 'react';
import { Search, UserPlus, X, ChevronDown } from 'lucide-react';
import ModalLayout from '../layout/ModalLayout';
import type { User, UserRole } from '@/types/users';
import { dummyUsers } from '@/services/users';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  onInvite: (data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    type: 'internal' | 'external' | 'vendor';
  }) => void;
  title?: string;
}

const userTypeOptions = [
  { value: 'internal', label: 'Staff' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'external', label: 'External' },
];

const roleOptions = {
  internal: [
    { value: 'engineer', label: 'Engineer' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'safety_officer', label: 'Safety Officer' },
  ],
  vendor: [
    { value: 'contractor', label: 'Contractor' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'service_provider', label: 'Service Provider' },
  ],
  external: [
    { value: 'architect', label: 'Architect' },
    { value: 'inspector', label: 'Inspector' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'observer', label: 'Observer' },
  ],
};

export default function UserSelectionModal({
  isOpen,
  onClose,
  onSelect,
  onInvite,
  title = 'Select or Invite User',
}: UserSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'internal' | 'external' | 'vendor'>('internal');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    type: 'internal' as 'internal' | 'external' | 'vendor',
    company: '',
  });

  const filteredUsers = dummyUsers.filter(
    (user) =>
      user.type === selectedType &&
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery)))
  );

  const handleTypeChange = (type: 'internal' | 'external' | 'vendor') => {
    setSelectedType(type);
    setInviteData(prev => ({ ...prev, type, role: '' }));
    setSearchQuery('');
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(inviteData);
    onClose();
  };

  return (
    <ModalLayout
      title={title}
      onClose={onClose}
      actions={
        showInviteForm ? (
          <>
            <button
              type="button"
              onClick={() => setShowInviteForm(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              form="invite-form"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Invitation
            </button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* User Type Selection */}
        <div className="flex gap-2 border-b pb-4">
          {userTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTypeChange(option.value as 'internal' | 'external' | 'vendor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedType === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {!showInviteForm ? (
          <>
            {/* Search Bar */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowInviteForm(true)}
                className="ml-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite New
              </button>
            </div>

            {/* User List */}
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    onSelect(user);
                    onClose();
                  }}
                >
                  <div>
                    <h3 className="font-medium">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.type === 'internal'
                      ? user.position
                      : user.type === 'vendor'
                      ? user.company
                      : user.role}
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  <p className="mb-2">No matching users found</p>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Invite a new user
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={inviteData.name}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={inviteData.email}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={inviteData.phone}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={inviteData.role}
                onChange={(e) =>
                  setInviteData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select a role</option>
                {roleOptions[selectedType].map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedType === 'vendor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={inviteData.company || ''}
                  onChange={(e) =>
                    setInviteData((prev) => ({ ...prev, company: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </form>
        )}
      </div>
    </ModalLayout>
  );
} 