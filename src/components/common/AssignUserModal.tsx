'use client';

import { useState, useEffect } from 'react';
import { X, Search, Mail, Phone, User as UserIcon } from 'lucide-react';
import { getUsers } from '@/services/users';
import type { User } from '@/types/users';

interface AssignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (data: {
    userId?: string;
    email?: string;
    phone?: string;
    role: string;
  }) => void;
  title?: string;
  roles: { value: string; label: string }[];
  defaultRole?: string;
}

export default function AssignUserModal({
  isOpen,
  onClose,
  onAssign,
  title = 'Assign User',
  roles,
  defaultRole,
}: AssignUserModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [assignmentType, setAssignmentType] = useState<'existing' | 'new'>('existing');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    role: defaultRole || roles[0].value,
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (assignmentType === 'existing' && selectedUser) {
      onAssign({
        userId: selectedUser.id,
        role: formData.role,
      });
    } else {
      onAssign({
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
      });
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setAssignmentType('existing')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                assignmentType === 'existing'
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Existing User
            </button>
            <button
              onClick={() => setAssignmentType('new')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                assignmentType === 'new'
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              New User
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {assignmentType === 'existing' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Users
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Search by name or email"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className={`w-full flex items-center p-3 hover:bg-gray-50 ${
                        selectedUser?.id === user.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="ml-3 text-left">
                        <div className="text-sm font-medium">{user.full_name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  assignmentType === 'existing'
                    ? !selectedUser
                    : !formData.email && !formData.phone
                }
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 