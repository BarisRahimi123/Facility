'use client';

import { X, Upload } from 'lucide-react';
import { useState } from 'react';

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    address: string;
    city: string;
    state: string;
    status: 'active' | 'completed' | 'on-hold' | 'planning';
    constructionType: string;
    projectManager: string;
    squareFootage: number;
    totalClassrooms: number;
    expectedCompletion: string;
    specialFacilities: string[];
    numberOfBuildings: number;
    numberOfPortables: number;
    parkingSpaces: number;
    totalFloors: number;
    yearBuilt: number;
    lastRenovated?: string;
    hvacSystems: number;
    elevators: number;
    maintenanceSchedule: 'weekly' | 'biweekly' | 'monthly';
    emergencyExits: number;
    accessControlPoints: number;
    utilityProviders: {
      electric: string;
      water: string;
      gas: string;
    };
    thumbnail: File | null;
  }) => void;
  initialData?: {
    name: string;
    address: string;
    city: string;
    state: string;
    status: 'active' | 'completed' | 'on-hold' | 'planning';
    constructionType: string;
    projectManager: string;
    squareFootage: number;
    totalClassrooms: number;
    expectedCompletion: string;
    specialFacilities: string[];
    numberOfBuildings: number;
    numberOfPortables: number;
    parkingSpaces: number;
    totalFloors: number;
    yearBuilt: number;
    lastRenovated?: string;
    hvacSystems: number;
    elevators: number;
    maintenanceSchedule: 'weekly' | 'biweekly' | 'monthly';
    emergencyExits: number;
    accessControlPoints: number;
    utilityProviders: {
      electric: string;
      water: string;
      gas: string;
    };
    thumbnail?: File | null;
  };
}

export default function CreateProjectModal({ onClose, onSubmit, initialData }: CreateProjectModalProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    status: initialData?.status || 'planning' as const,
    constructionType: initialData?.constructionType || '',
    projectManager: initialData?.projectManager || '',
    squareFootage: initialData?.squareFootage || 0,
    totalClassrooms: initialData?.totalClassrooms || 0,
    expectedCompletion: initialData?.expectedCompletion || '',
    specialFacilities: initialData?.specialFacilities || [],
    numberOfBuildings: initialData?.numberOfBuildings || 1,
    numberOfPortables: initialData?.numberOfPortables || 0,
    parkingSpaces: initialData?.parkingSpaces || 0,
    totalFloors: initialData?.totalFloors || 1,
    yearBuilt: initialData?.yearBuilt || new Date().getFullYear(),
    lastRenovated: initialData?.lastRenovated || '',
    hvacSystems: initialData?.hvacSystems || 0,
    elevators: initialData?.elevators || 0,
    maintenanceSchedule: initialData?.maintenanceSchedule || 'monthly' as const,
    emergencyExits: initialData?.emergencyExits || 0,
    accessControlPoints: initialData?.accessControlPoints || 0,
    utilityProviders: initialData?.utilityProviders || {
      electric: '',
      water: '',
      gas: '',
    },
    thumbnail: initialData?.thumbnail || null,
  });

  const [newFacility, setNewFacility] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAddFacility = () => {
    if (newFacility.trim()) {
      setFormData(prev => ({
        ...prev,
        specialFacilities: [...prev.specialFacilities, newFacility.trim()]
      }));
      setNewFacility('');
    }
  };

  const removeFacility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialFacilities: prev.specialFacilities.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    value={formData.projectManager}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectManager: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as typeof formData.status }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Construction Type
                  </label>
                  <input
                    type="text"
                    value={formData.constructionType}
                    onChange={(e) => setFormData(prev => ({ ...prev, constructionType: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Building Specifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Building Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    value={formData.squareFootage}
                    onChange={(e) => setFormData(prev => ({ ...prev, squareFootage: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Buildings
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfBuildings}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfBuildings: parseInt(e.target.value) || 1 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Portables
                  </label>
                  <input
                    type="number"
                    value={formData.numberOfPortables}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfPortables: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Floors
                  </label>
                  <input
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalFloors: parseInt(e.target.value) || 1 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Parking Spaces
                  </label>
                  <input
                    type="number"
                    value={formData.parkingSpaces}
                    onChange={(e) => setFormData(prev => ({ ...prev, parkingSpaces: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Classrooms
                  </label>
                  <input
                    type="number"
                    value={formData.totalClassrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalClassrooms: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Facility Systems */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Facility Systems</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    HVAC Systems
                  </label>
                  <input
                    type="number"
                    value={formData.hvacSystems}
                    onChange={(e) => setFormData(prev => ({ ...prev, hvacSystems: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Elevators
                  </label>
                  <input
                    type="number"
                    value={formData.elevators}
                    onChange={(e) => setFormData(prev => ({ ...prev, elevators: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Emergency Exits
                  </label>
                  <input
                    type="number"
                    value={formData.emergencyExits}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyExits: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Access Control Points
                  </label>
                  <input
                    type="number"
                    value={formData.accessControlPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, accessControlPoints: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maintenance Schedule
                  </label>
                  <select
                    value={formData.maintenanceSchedule}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenanceSchedule: e.target.value as typeof formData.maintenanceSchedule }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Year Built
                  </label>
                  <input
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearBuilt: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Renovated
                  </label>
                  <input
                    type="date"
                    value={formData.lastRenovated}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastRenovated: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Utility Providers */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Utility Providers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Electric Provider
                  </label>
                  <input
                    type="text"
                    value={formData.utilityProviders.electric}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      utilityProviders: { ...prev.utilityProviders, electric: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Water Provider
                  </label>
                  <input
                    type="text"
                    value={formData.utilityProviders.water}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      utilityProviders: { ...prev.utilityProviders, water: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gas Provider
                  </label>
                  <input
                    type="text"
                    value={formData.utilityProviders.gas}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      utilityProviders: { ...prev.utilityProviders, gas: e.target.value }
                    }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Special Facilities */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Special Facilities</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Add a facility"
                  />
                  <button
                    type="button"
                    onClick={handleAddFacility}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.specialFacilities.map((facility, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {facility}
                      <button
                        type="button"
                        onClick={() => removeFacility(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expected Completion
                  </label>
                  <input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedCompletion: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Project Thumbnail */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Thumbnail</h3>
              <div className="border border-[#E0E0E0] rounded-lg p-4">
                <div className="flex items-center gap-4">
                  {previewUrl && (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-center w-full">
                      <label className="w-full flex flex-col items-center justify-center px-4 py-2 bg-white rounded-lg border border-dashed border-[#E0E0E0] cursor-pointer hover:bg-gray-50">
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-sm text-gray-500">
                          {previewUrl ? 'Change thumbnail' : 'Upload a thumbnail'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Recommended size: 800x600px. Max file size: 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {initialData ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 