'use client';

import { useState } from 'react';
import { Building2, MapPin, Calendar, CheckCircle2, Users, MoreVertical, X } from 'lucide-react';
import EditProjectModal from '@/components/dashboard/EditProjectModal';

interface Project {
  name: string;
  address: string;
  city: string;
  state: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  createdDate: string;
  squareFootage: number;
  constructionType: string;
  projectManager: string;
  expectedCompletion: string;
  totalClassrooms: number;
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
  thumbnailUrl?: string;
}

// Sample project data
const initialProjectData: Project = {
  name: "Washington Elementary",
  address: "1234 Education Drive",
  city: "Minneapolis",
  state: "Minnesota",
  status: "active",
  createdDate: "2024-01-15",
  squareFootage: 85000,
  constructionType: "New Construction",
  projectManager: "John Smith",
  expectedCompletion: "2025-08-15",
  totalClassrooms: 32,
  specialFacilities: ["Gymnasium", "Library", "Cafeteria", "Science Lab", "Art Studio"],
  numberOfBuildings: 3,
  numberOfPortables: 2,
  parkingSpaces: 120,
  totalFloors: 2,
  yearBuilt: 1995,
  lastRenovated: "2020-06-15",
  hvacSystems: 8,
  elevators: 2,
  maintenanceSchedule: "weekly",
  emergencyExits: 12,
  accessControlPoints: 6,
  utilityProviders: {
    electric: "Minnesota Power",
    water: "City of Minneapolis",
    gas: "CenterPoint Energy"
  }
};

export default function ProjectOverviewPage() {
  const [projectData, setProjectData] = useState<Project>(initialProjectData);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSave = (updatedProject: Project) => {
    // If a new thumbnail was uploaded, create a URL for it
    if (updatedProject.thumbnail) {
      const url = URL.createObjectURL(updatedProject.thumbnail);
      setProjectData({ ...updatedProject, thumbnailUrl: url });
    } else if (updatedProject.thumbnailUrl) {
      // If there's an existing thumbnailUrl but no new thumbnail, preserve the URL
      setProjectData({ ...updatedProject });
    } else {
      // If no thumbnail or thumbnailUrl, just update the project data
      setProjectData(updatedProject);
    }
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Project Thumbnail */}
              {(projectData.thumbnailUrl || projectData.thumbnail) && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={projectData.thumbnailUrl || (projectData.thumbnail ? URL.createObjectURL(projectData.thumbnail) : '')}
                    alt={projectData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-2xl font-semibold text-gray-900">{projectData.name}</h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {projectData.address}, {projectData.city}, {projectData.state}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${
                projectData.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                projectData.status === 'completed' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                projectData.status === 'on-hold' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' :
                'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
              }`}>
                {projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1)}
              </span>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors duration-200"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Edit Project Information
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
        {/* Basic Information */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b border-gray-200">
            <Users className="w-5 h-5 text-gray-400" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Project Manager</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.projectManager}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Construction Type</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.constructionType}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Year Built</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.yearBuilt}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Last Renovated</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.lastRenovated ? new Date(projectData.lastRenovated).toLocaleDateString() : 'N/A'}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Building Specifications */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b border-gray-200">
            <Building2 className="w-5 h-5 text-gray-400" />
            Building Specifications
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Total Area</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.squareFootage.toLocaleString()} sq ft
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Buildings & Portables</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.numberOfBuildings} buildings, {projectData.numberOfPortables} portables
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Total Floors</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.totalFloors} floors
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Parking Capacity</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.parkingSpaces} spaces
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Facility Systems */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b border-gray-200">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Facility Systems
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">HVAC Systems</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.hvacSystems} units
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Elevators</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.elevators} units
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Emergency Exits</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.emergencyExits} exits
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Access Control Points</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.accessControlPoints} points
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Maintenance */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b border-gray-200">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Maintenance
          </h2>
          <div className="space-y-8">
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Maintenance Schedule</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  <span className="capitalize">{projectData.maintenanceSchedule}</span>
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-3 block">Utility Providers</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(projectData.utilityProviders).map(([key, value]) => (
                  <div key={key} className="group">
                    <div onClick={() => setIsEditModalOpen(true)} 
                         className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                      <span className="text-sm font-medium text-gray-500 capitalize">{key}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{value}</span>
                        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Rooms & Facilities */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b border-gray-200">
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 21h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 7h6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11h6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 15h6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Rooms & Facilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Total Classrooms</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {projectData.totalClassrooms}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Special Facilities</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <div className="flex flex-wrap gap-2">
                  {projectData.specialFacilities.map((facility, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full ring-1 ring-blue-600/20"
                    >
                      {facility}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 self-center">(Click to edit)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-2 border-b border-gray-200">
            <Calendar className="w-5 h-5 text-gray-400" />
            Timeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Start Date</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {new Date(projectData.createdDate).toLocaleDateString()}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Expected Completion</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {new Date(projectData.expectedCompletion).toLocaleDateString()}
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
            <div className="group">
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">Duration</label>
              <div onClick={() => setIsEditModalOpen(true)} className="p-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                <p className="text-gray-900 flex items-center gap-2">
                  {Math.ceil((new Date(projectData.expectedCompletion).getTime() - new Date(projectData.createdDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">(Click to edit)</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditProjectModal
          project={projectData}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
} 