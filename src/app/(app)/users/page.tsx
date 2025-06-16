'use client';

import { useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import AddStaffModal from '@/components/users/AddStaffModal';
import AddObserverModal from '@/components/users/AddObserverModal';
import AddVendorModal from '@/components/users/AddVendorModal';
import EditStaffModal from '@/components/users/EditStaffModal';
import EditObserverModal from '@/components/users/EditObserverModal';
import EditVendorModal from '@/components/users/EditVendorModal';
import UsersTable from '@/components/users/UsersTable';
import type { User, InternalUser, ExternalUser, Vendor, UserRole, UserStatus } from '@/types/users';

// Sample data
const sampleUsers: User[] = [
  {
    id: '1',
    type: 'internal',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    status: 'active',
    department: 'Facilities',
    position: 'Senior Manager',
    employeeId: 'EMP001',
    accessLevel: 'manager',
    certifications: ['HVAC', 'Electrical'],
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InternalUser,
  {
    id: '2',
    type: 'external',
    name: 'Jane Smith',
    email: 'jane@observer.com',
    status: 'active',
    company: 'ABC Consulting',
    role: 'Project Observer',
    permissions: [
      { area: 'plans', access: 'view' },
      { area: 'tasks', access: 'edit' }
    ],
    projectAccess: ['Project A', 'Project B'],
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ExternalUser,
  {
    id: '3',
    type: 'vendor',
    name: 'Bob Wilson',
    email: 'bob@vendor.com',
    phone: '+1987654321',
    status: 'active',
    company: 'XYZ Services',
    services: ['HVAC', 'Plumbing'],
    customServices: [],
    insurance: {
      liability: true,
      workersComp: true,
      auto: true,
      umbrella: false
    },
    permissions: [
      { area: 'tasks', access: 'edit' },
      { area: 'photos', access: 'edit' }
    ],
    rating: 4.5,
    contractNumber: 'CNT001',
    contractStatus: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Vendor
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'vendor'>('internal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddObserverModal, setShowAddObserverModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(sampleUsers);

  const filteredUsers = users.filter(user => 
    user.type === activeTab &&
    (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (user.phone?.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleAddStaff = (staffData: {
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    employeeId: string;
    accessLevel: 'admin' | 'manager' | 'staff';
    certifications: string[];
    status: 'active' | 'inactive' | 'pending';
  }) => {
    const newStaff: InternalUser = {
      id: String(users.length + 1),
      type: 'internal',
      ...staffData,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUsers([...users, newStaff]);
    setShowAddStaffModal(false);
  };

  const handleAddObserver = (observerData: {
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
  }) => {
    const newObserver: ExternalUser = {
      id: String(users.length + 1),
      type: 'external',
      ...observerData,
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUsers([...users, newObserver]);
    setShowAddObserverModal(false);
  };

  const handleAddVendor = (vendorData: {
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
  }) => {
    const newVendor: Vendor = {
      id: String(users.length + 1),
      type: 'vendor',
      ...vendorData,
      rating: 0,
      contractStatus: 'active',
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setUsers([...users, newVendor]);
    setShowAddVendorModal(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveEdit = (userData: Partial<User>) => {
    if (!editingUser) return;

    const updatedUser = {
      ...editingUser,
      ...userData,
      updatedAt: new Date(),
    } as User;

    setUsers(users.map(user => 
      user.id === editingUser.id ? updatedUser : user
    ));
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              switch (activeTab) {
                case 'internal':
                  setShowAddStaffModal(true);
                  break;
                case 'external':
                  setShowAddObserverModal(true);
                  break;
                case 'vendor':
                  setShowAddVendorModal(true);
                  break;
              }
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {activeTab === 'internal' ? 'Staff' : activeTab === 'external' ? 'Observer' : 'Vendor'}
          </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'internal'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Internal Staff
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'external'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            External Observers
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'vendor'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Vendors
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        userType={activeTab}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Add Modals */}
      {showAddStaffModal && (
        <AddStaffModal
          isOpen={showAddStaffModal}
          onClose={() => setShowAddStaffModal(false)}
          onSave={handleAddStaff}
        />
      )}

      {showAddObserverModal && (
        <AddObserverModal
          isOpen={showAddObserverModal}
          onClose={() => setShowAddObserverModal(false)}
          onSave={handleAddObserver}
        />
      )}

      {showAddVendorModal && (
        <AddVendorModal
          isOpen={showAddVendorModal}
          onClose={() => setShowAddVendorModal(false)}
          onSave={handleAddVendor}
        />
      )}

      {/* Edit Modals */}
      {editingUser?.type === 'internal' && (
        <EditStaffModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
          user={editingUser as InternalUser}
        />
      )}

      {editingUser?.type === 'external' && (
        <EditObserverModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
          user={editingUser as ExternalUser}
        />
      )}

      {editingUser?.type === 'vendor' && (
        <EditVendorModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
          user={editingUser as Vendor}
        />
      )}
    </div>
  );
} 