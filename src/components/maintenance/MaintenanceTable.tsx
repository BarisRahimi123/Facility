'use client';

import { useState } from 'react';
import { ChevronDown, Search, Filter, ArrowUpDown } from 'lucide-react';
import type { MaintenanceTask, PurchaseOrder } from '@/types/maintenance';

interface MaintenanceTableProps {
  tasks: MaintenanceTask[];
  purchaseOrders: PurchaseOrder[];
  onTaskClick: (task: MaintenanceTask) => void;
  onPOClick: (po: PurchaseOrder) => void;
  activeTab: 'tasks' | 'orders';
  onTabChange: (tab: 'tasks' | 'orders') => void;
}

export default function MaintenanceTable({
  tasks,
  purchaseOrders,
  onTaskClick,
  onPOClick,
  activeTab,
  onTabChange,
}: MaintenanceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPOs = purchaseOrders.filter((po) =>
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortField) return 0;
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'title':
        return direction * a.title.localeCompare(b.title);
      case 'priority':
        return direction * a.priority.localeCompare(b.priority);
      case 'status':
        return direction * a.status.localeCompare(b.status);
      case 'date':
        return direction * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      default:
        return 0;
    }
  });

  const sortedPOs = [...filteredPOs].sort((a, b) => {
    if (!sortField) return 0;
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'poNumber':
        return direction * a.poNumber.localeCompare(b.poNumber);
      case 'status':
        return direction * a.status.localeCompare(b.status);
      case 'amount':
        return direction * (a.totalAmount - b.totalAmount);
      case 'date':
        return direction * (new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime());
      default:
        return 0;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table Header */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onTabChange('tasks')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'tasks'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Maintenance Tasks
            </button>
            <button
              onClick={() => onTabChange('orders')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Purchase Orders
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {activeTab === 'tasks' ? (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Title <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('priority')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Priority <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Status <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Start Date <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500">{task.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'}`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {task.assignedTo || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(task.startDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('poNumber')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    PO Number <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Status <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Total Amount <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Request Date <ArrowUpDown className="w-4 h-4" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPOs.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => onPOClick(po)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {po.poNumber}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${po.status === 'approved' ? 'bg-green-100 text-green-800' :
                        po.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'}`}
                    >
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {po.requestedBy}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${po.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(po.requestDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 