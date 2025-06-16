'use client';

import { useState } from 'react';
import { 
  Plus, 
  FileText, 
  History, 
  ChevronRight, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Clock,
  Users,
  ChevronUp,
  ChevronDown,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateSpecificationModal from '@/components/specifications/CreateSpecificationModal';
import SpecificationPreview from '@/components/specifications/SpecificationPreview';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Template {
  id: string;
  name: string;
  category: string;
  lastUpdated: string;
  version: string;
  status: 'Published' | 'Draft' | 'Under Review';
  author: string;
  collaborators: number;
}

const specCategories: Category[] = [
  { id: 'architectural', name: 'Architectural', count: 12 },
  { id: 'structural', name: 'Structural', count: 8 },
  { id: 'mechanical', name: 'Mechanical', count: 6 },
  { id: 'electrical', name: 'Electrical', count: 9 },
  { id: 'plumbing', name: 'Plumbing', count: 5 },
  { id: 'civil', name: 'Civil', count: 7 },
];

const specTemplates: Template[] = [
  {
    id: '1',
    name: 'Foundation Specification',
    category: 'structural',
    lastUpdated: '2 days ago',
    version: '2.1',
    status: 'Published',
    author: 'John Smith',
    collaborators: 3,
  },
  {
    id: '2',
    name: 'Wall Assembly',
    category: 'architectural',
    lastUpdated: '5 days ago',
    version: '1.0',
    status: 'Draft',
    author: 'Sarah Johnson',
    collaborators: 2,
  },
  {
    id: '3',
    name: 'HVAC Requirements',
    category: 'mechanical',
    lastUpdated: '1 week ago',
    version: '3.2',
    status: 'Under Review',
    author: 'Mike Chen',
    collaborators: 4,
  },
];

export default function SpecificationsPage() {
  const [activeTab, setActiveTab] = useState<string>('architectural');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'version'>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<Template | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Published' | 'Draft' | 'Under Review' | 'all'>('all');

  const handleSort = (field: 'name' | 'updated' | 'version') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredSpecs = specTemplates
    .filter((spec) => spec.category === activeTab)
    .filter((spec) => statusFilter === 'all' || spec.status === statusFilter)
    .filter((spec) => 
      spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return direction * a.name.localeCompare(b.name);
        case 'version':
          return direction * a.version.localeCompare(b.version);
        case 'updated':
          return direction * (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
        default:
          return 0;
      }
    });

  const handleCreateSpec = (data: any) => {
    // TODO: Implement specification creation
    setShowCreateModal(false);
  };

  const renderSortIcon = (field: 'name' | 'updated' | 'version') => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="h-full flex">
      {/* Categories Sidebar */}
      <div className="w-64 border-r border-[#E0E0E0] p-4 space-y-4">
        <Button 
          className="w-full flex items-center justify-center px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Specification
        </Button>

        <div className="space-y-1">
          {specCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                activeTab === category.id
                  ? 'bg-blue-50 text-[#1a73e8]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-sm text-gray-500">{category.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#333333]">Specifications</h1>
              <p className="text-gray-500 mt-1">
                Manage and organize construction specifications
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('Published')}>
                    Published
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('Draft')}>
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('Under Review')}>
                    Under Review
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search specifications..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className={`flex-1 ${selectedSpec ? 'mr-96' : ''}`}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* New Template Card */}
                <div 
                  className="border border-dashed border-[#E0E0E0] rounded-lg p-6 flex flex-col items-center justify-center hover:border-[#1a73e8] cursor-pointer"
                  onClick={() => setShowCreateModal(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-[#1a73e8] bg-opacity-10 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6 text-[#1a73e8]" />
                  </div>
                  <p className="text-[#1a73e8] font-medium">Create New Template</p>
                </div>

                {/* Template Cards */}
                {sortedAndFilteredSpecs.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white border border-[#E0E0E0] rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedSpec(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-[#1a73e8] mr-3" />
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <div className="text-sm text-gray-500 mt-1">
                            Version {template.version}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="w-4 h-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E0E0E0]">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {template.lastUpdated}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          template.status === 'Published' ? 'bg-green-100 text-green-800' :
                          template.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {template.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{template.author}</span>
                        <div className="flex items-center text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          {template.collaborators}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E0E0E0] rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-[#E0E0E0]">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Name
                          {renderSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('version')}
                      >
                        <div className="flex items-center">
                          Version
                          {renderSortIcon('version')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('updated')}
                      >
                        <div className="flex items-center">
                          Last Updated
                          {renderSortIcon('updated')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {sortedAndFilteredSpecs.map((template) => (
                      <tr 
                        key={template.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSpec(template)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-[#1a73e8] mr-3" />
                            <span className="font-medium">{template.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">v{template.version}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            template.status === 'Published' ? 'bg-green-100 text-green-800' :
                            template.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {template.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{template.author}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{template.lastUpdated}</td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="w-4 h-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedSpec && (
            <SpecificationPreview
              specification={selectedSpec}
              onClose={() => setSelectedSpec(null)}
            />
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateSpecificationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSpec}
        />
      )}
    </div>
  );
} 