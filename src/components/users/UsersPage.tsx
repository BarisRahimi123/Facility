'use client';

import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import AddStaffModal from './AddStaffModal';
import AddObserverModal from './AddObserverModal';
import AddVendorModal from './AddVendorModal';
import EditStaffModal from './EditStaffModal';
import EditObserverModal from './EditObserverModal';
import EditVendorModal from './EditVendorModal';
import type { User, InternalUser, ExternalUser, Vendor } from '@/types/users';

interface TypeGuards {
  isInternalUser: (user: User) => user is InternalUser;
  isExternalUser: (user: User) => user is ExternalUser;
  isVendorUser: (user: User) => user is Vendor;
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'vendor'>('internal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddObserverModalOpen, setIsAddObserverModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([
    // Internal Staff
    {
      id: '1',
      type: 'internal',
      name: 'John Smith',
      email: 'john.smith@district.edu',
      phone: '555-0101',
      department: 'Maintenance',
      position: 'Lead Technician',
      employeeId: 'EMP001',
      accessLevel: 'admin',
      certifications: ['HVAC', 'Electrical'],
      status: 'active',
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // External Observer
    {
      id: '2',
      type: 'external',
      name: 'Sarah Johnson',
      email: 'sarah@consultancy.com',
      phone: '555-0102',
      company: 'Education Consultancy LLC',
      role: 'Safety Inspector',
      permissions: [
        { area: 'plans', access: 'view' },
        { area: 'tasks', access: 'edit' },
        { area: 'photos', access: 'view' },
        { area: 'forms', access: 'edit' },
        { area: 'specifications', access: 'view' },
      ],
      projectAccess: ['Project A', 'Project B'],
      status: 'active',
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Vendor
    {
      id: '3',
      type: 'vendor',
      name: 'Mike Wilson',
      email: 'mike@hvacpros.com',
      phone: '555-0103',
      company: 'HVAC Professionals Inc.',
      services: ['HVAC', 'Ventilation'],
      customServices: [],
      insurance: {
        liability: true,
        workersComp: true,
        auto: true,
        umbrella: false,
      },
      permissions: [
        { area: 'tasks', access: 'edit' },
        { area: 'photos', access: 'edit' },
        { area: 'forms', access: 'view' },
      ],
      rating: 4.5,
      contractNumber: 'CNT001',
      contractStatus: 'active',
      status: 'active',
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const typeGuards: TypeGuards = {
    isInternalUser: (user: User): user is InternalUser => user.type === 'internal',
    isExternalUser: (user: User): user is ExternalUser => user.type === 'external',
    isVendorUser: (user: User): user is Vendor => user.type === 'vendor',
  };

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
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...staffData,
    };
    setUsers([...users, newStaff]);
    setIsAddStaffModalOpen(false);
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
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...observerData,
    };
    setUsers([...users, newObserver]);
    setIsAddObserverModalOpen(false);
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
      lastActive: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: 0,
      contractStatus: 'active',
      ...vendorData,
    };
    setUsers([...users, newVendor]);
    setIsAddVendorModalOpen(false);
  };

  const handleEditUser = (userData: Partial<User>) => {
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

  const getOrganization = (user: User): string => {
    if (typeGuards.isInternalUser(user)) {
      return user.department;
    } else if (typeGuards.isExternalUser(user) || typeGuards.isVendorUser(user)) {
      return user.company;
    }
    return '';
  };

  const filteredUsers = users.filter(user => {
    const matchesTab = (
      (activeTab === 'internal' && typeGuards.isInternalUser(user)) ||
      (activeTab === 'external' && typeGuards.isExternalUser(user)) ||
      (activeTab === 'vendor' && typeGuards.isVendorUser(user))
    );

    if (!matchesTab) return false;

    const searchFields = [
      user.name,
      user.email,
      user.phone || '',
      typeGuards.isInternalUser(user) ? user.department :
      (typeGuards.isExternalUser(user) || typeGuards.isVendorUser(user)) ? user.company : '',
    ].filter((field): field is string => typeof field === 'string');

    return !searchQuery || searchFields.some(field =>
      field.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderUserCard = (user: User) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-red-100 text-red-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div key={user.id} className="p-4 bg-white rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
            {user.status}
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Organization:</span> {getOrganization(user)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Phone:</span> {user.phone || 'N/A'}
          </p>
          
          {typeGuards.isInternalUser(user) && (
            <>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Position:</span> {user.position}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Employee ID:</span> {user.employeeId}
              </p>
              {user.certifications.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.certifications.map(cert => (
                    <span key={cert} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {typeGuards.isExternalUser(user) && (
            <>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Role:</span> {user.role}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Projects:</span> {user.projectAccess.join(', ')}
              </p>
            </>
          )}

          {typeGuards.isVendorUser(user) && (
            <>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Services:</span> {user.services.join(', ')}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(user.insurance).map(([key, value]) => (
                  value && (
                    <span key={key} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {key.replace(/([A-Z])/g, ' $1').trim()} Insurance
                    </span>
                  )
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setEditingUser(user)}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8]"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          {activeTab === 'internal' && (
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          )}
          {activeTab === 'external' && (
            <button
              onClick={() => setIsAddObserverModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Observer
            </button>
          )}
          {activeTab === 'vendor' && (
            <button
              onClick={() => setIsAddVendorModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Vendor
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'internal'
                ? 'bg-[#1a73e8] text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Internal Staff
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'external'
                ? 'bg-[#1a73e8] text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            External Observers
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'vendor'
                ? 'bg-[#1a73e8] text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Vendors
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(renderUserCard)}
      </div>

      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSave={handleAddStaff}
      />

      <AddObserverModal
        isOpen={isAddObserverModalOpen}
        onClose={() => setIsAddObserverModalOpen(false)}
        onSave={handleAddObserver}
      />

      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onSave={handleAddVendor}
      />

      {editingUser?.type === 'internal' && (
        <EditStaffModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
          user={editingUser as InternalUser}
        />
      )}

      {editingUser?.type === 'external' && (
        <EditObserverModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
          user={editingUser as ExternalUser}
        />
      )}

      {editingUser?.type === 'vendor' && (
        <EditVendorModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
          user={editingUser as Vendor}
        />
      )}
    </div>
  );
} 