'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import type { User, InternalUser, ExternalUser, Vendor } from '@/types/users';

interface UsersTableProps {
  users: User[];
  userType: 'internal' | 'external' | 'vendor';
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export default function UsersTable({ users, userType, onEdit, onDelete }: UsersTableProps) {
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const aValue = (a as any)[sortField];
    const bValue = (b as any)[sortField];
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction * (aValue.getTime() - bValue.getTime());
    }
    if (typeof aValue === 'string') {
      return direction * aValue.localeCompare(bValue);
    }
    return direction * (aValue - bValue);
  });

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const renderHeader = () => {
    const baseHeaders = [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'status', label: 'Status' },
      { field: 'lastActive', label: 'Last Active' },
    ];

    const typeSpecificHeaders = {
      internal: [
        { field: 'department', label: 'Department' },
        { field: 'position', label: 'Position' },
        { field: 'accessLevel', label: 'Access Level' },
      ],
      external: [
        { field: 'company', label: 'Company' },
        { field: 'role', label: 'Role' },
        { field: 'projectAccess', label: 'Projects' },
      ],
      vendor: [
        { field: 'company', label: 'Company' },
        { field: 'services', label: 'Services' },
        { field: 'contractStatus', label: 'Contract Status' },
      ],
    };

    const headers = [...baseHeaders, ...typeSpecificHeaders[userType]];

    return (
      <tr>
        {headers.map(({ field, label }) => (
          <th
            key={field}
            onClick={() => handleSort(field)}
            className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-1">
              {label}
              {renderSortIcon(field)}
            </div>
          </th>
        ))}
        <th className="px-4 py-3 text-right">Actions</th>
      </tr>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderCell = (user: User, field: string) => {
    const value = (user as any)[field];
    
    if (value instanceof Date) {
      return formatDate(value);
    }
    
    switch (field) {
      case 'status':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${value === 'active' ? 'bg-green-100 text-green-800' : 
              value === 'inactive' ? 'bg-gray-100 text-gray-800' : 
              'bg-yellow-100 text-yellow-800'}`}
          >
            {value}
          </span>
        );
      case 'services':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'projectAccess':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'accessLevel':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${value === 'admin' ? 'bg-purple-100 text-purple-800' : 
              value === 'manager' ? 'bg-blue-100 text-blue-800' : 
              'bg-gray-100 text-gray-800'}`}
          >
            {value}
          </span>
        );
      case 'contractStatus':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
            ${value === 'active' ? 'bg-green-100 text-green-800' : 
              value === 'expired' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'}`}
          >
            {value}
          </span>
        );
      default:
        return value || 'N/A';
    }
  };

  // List of fields to display based on user type
  const getDisplayFields = () => {
    const baseFields = ['name', 'email', 'phone', 'status', 'lastActive'];
    const typeSpecificFields = {
      internal: ['department', 'position', 'accessLevel'],
      external: ['company', 'role', 'projectAccess'],
      vendor: ['company', 'services', 'contractStatus'],
    };
    
    return [...baseFields, ...typeSpecificFields[userType]];
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">{renderHeader()}</thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                {getDisplayFields().map((field) => (
                  <td key={field} className="px-4 py-3 text-sm text-gray-900">
                    {renderCell(user, field)}
                  </td>
                ))}
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 