'use client';

import { useState, useEffect } from 'react';
import MatterportViewer from '@/components/virtual-tour/MatterportViewer';
import EditTourModal from '@/components/virtual-tour/EditTourModal';
import { Plus, MoreVertical, Clock, ChevronDown, MapPin, Calendar, CheckCircle2, Users, Building2 } from 'lucide-react';
import ChatAssistant from '@/components/chat/ChatAssistant';

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
}

interface Tour {
  id: string;
  name: string;
  modelId: string;
  description: string;
  lastUpdated: string;
}

// Sample project data
const projectData: Project = {
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
  specialFacilities: ["Gymnasium", "Library", "Cafeteria", "Science Lab", "Art Studio"]
};

// Sample tours data
const sampleTours: Tour[] = [
  {
    id: '1',
    name: 'Main Building Tour',
    modelId: 'SxQL3iGyoDo',
    description: 'Complete virtual tour of the main building including all floors and facilities.',
    lastUpdated: '2024-02-15',
  },
];

export default function VirtualTourPage() {
  const [tours, setTours] = useState<Tour[]>(sampleTours);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.tour-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTour = (tourData: { name: string; modelId: string; description: string }) => {
    const newTour: Tour = {
      id: Math.random().toString(36).substr(2, 9),
      ...tourData,
      lastUpdated: new Date().toISOString(),
    };
    setTours(prev => [...prev, newTour]);
    setSelectedTour(newTour);
  };

  const handleEditTour = (tourData: { name: string; modelId: string; description: string }) => {
    if (!editingTour) return;
    
    const updatedTour: Tour = {
      ...editingTour,
      ...tourData,
      lastUpdated: new Date().toISOString(),
    };

    setTours(prev => prev.map(tour => 
      tour.id === editingTour.id ? updatedTour : tour
    ));
    
    setEditingTour(null);
    setIsEditModalOpen(false);
    
    if (selectedTour?.id === editingTour.id) {
      setSelectedTour(updatedTour);
    }
  };

  const handleDeleteTour = (tourId: string) => {
    setTours(prev => prev.filter(tour => tour.id !== tourId));
    if (selectedTour?.id === tourId) {
      setSelectedTour(null);
    }
    setIsDropdownOpen(false);
  };

  const openEditModal = (tour?: Tour) => {
    setEditingTour(tour || null);
    setIsEditModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-white border-b border-[#E0E0E0]">
        <div className="px-8 pt-6 pb-4">
          {/* Title and Main Actions */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-[32px] font-medium text-[#1A1A1A] tracking-[-0.5px] leading-tight">
                  {projectData.name}
                </h1>
                <span className={`px-2 py-0.5 text-sm rounded-full ${
                  projectData.status === 'active' ? 'bg-green-100 text-green-700' :
                  projectData.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  projectData.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {projectData.status.charAt(0).toUpperCase() + projectData.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-[#6B7280]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{projectData.address}, {projectData.city}, {projectData.state}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {new Date(projectData.expectedCompletion).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openEditModal()}
                className="flex items-center px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Virtual Tour
              </button>
              {selectedTour && (
                <button className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-[#1A1A1A]">{selectedTour.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 bg-[#F8F9FA]">
        {selectedTour ? (
          <div className="h-full">
            <MatterportViewer modelId={selectedTour.modelId} />
          </div>
        ) : (
          <div className="h-full p-8">
            <div className="bg-white rounded-lg border border-[#E0E0E0] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#333333]">Available Virtual Tours</h2>
                <button
                  onClick={() => openEditModal()}
                  className="flex items-center px-3 py-1.5 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Tour
                </button>
              </div>
              {tours.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tours.map((tour) => (
                    <div
                      key={tour.id}
                      onClick={() => setSelectedTour(tour)}
                      className="p-4 border border-[#E0E0E0] rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
                    >
                      <h4 className="font-medium text-gray-900 mb-1">{tour.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{tour.description}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Last updated: {new Date(tour.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No virtual tours available. Add one to get started.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditTourModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTour(null);
          }}
          onSave={editingTour ? handleEditTour : handleAddTour}
          tour={editingTour}
        />
      )}
      <ChatAssistant />
    </div>
  );
} 