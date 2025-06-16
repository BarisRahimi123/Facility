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

export default function TestPeoplePage() {
  const [activeTab, setActiveTab] = useState('internal');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test People Page</h1>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">People</h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Add User
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

        {/* Simple Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-gray-700">This is a simplified version of the people page.</p>
          <p className="text-gray-700 mt-2">Currently showing: <strong>{activeTab}</strong> tab</p>
        </div>
      </div>
    </div>
  );
} 