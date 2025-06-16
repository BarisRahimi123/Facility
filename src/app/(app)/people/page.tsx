'use client';

import { useState } from 'react';

// Define simplified user types
interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  type: 'internal' | 'external' | 'vendor';
}

interface InternalUser extends BaseUser {
  type: 'internal';
  department: string;
  position: string;
}

interface ExternalUser extends BaseUser {
  type: 'external';
  company: string;
  role: string;
}

interface VendorUser extends BaseUser {
  type: 'vendor';
  company: string;
  services: string[];
}

type User = InternalUser | ExternalUser | VendorUser;

// Sample data
const dummyUsers: User[] = [
  {
    id: '1',
    type: 'internal',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1234567890',
    status: 'active',
    department: 'Engineering',
    position: 'Senior Engineer',
  },
  {
    id: '2',
    type: 'vendor',
    name: 'ABC Construction',
    email: 'contact@abcconstruction.com',
    phone: '+1987654321',
    status: 'active',
    company: 'ABC Construction Inc.',
    services: ['Construction', 'Renovation'],
  },
  {
    id: '3',
    type: 'external',
    name: 'Sarah Johnson',
    email: 'sarah@consultancy.com',
    phone: '+1122334455',
    status: 'active',
    company: 'Expert Consultancy',
    role: 'Consultant',
  },
];

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState<'internal' | 'external' | 'vendor'>('internal');
  const [users] = useState<User[]>(dummyUsers);

  const filteredUsers = users.filter((user) => user.type === activeTab);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">People</h1>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center"
          >
            Add {activeTab === 'internal' ? 'Staff' : activeTab === 'external' ? 'Observer' : 'Vendor'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'internal'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Staff
          </button>
          <button
            onClick={() => setActiveTab('vendor')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'vendor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Vendors
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'external'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            External
          </button>
        </div>

        {/* Simple Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {activeTab === 'internal' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  </>
                )}
                {activeTab === 'external' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  </>
                )}
                {activeTab === 'vendor' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  {user.type === 'internal' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position}</td>
                    </>
                  )}
                  {user.type === 'external' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                    </>
                  )}
                  {user.type === 'vendor' && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.services.join(', ')}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 