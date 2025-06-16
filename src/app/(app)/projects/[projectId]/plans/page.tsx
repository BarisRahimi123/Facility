'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Filter, Grid, List } from 'lucide-react';
import Image from 'next/image';
import AddPlanModal from '@/components/plans/AddPlanModal';
import PDFViewer from '@/components/plans/PDFViewer';

interface Plan {
  id: string;
  number: string;
  title: string;
  imageUrl: string;
  projectId: string;
  category: string;
  lastModified: string;
  pdfUrl?: string;
}

export default function ProjectPlansPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    // In a real app, this would fetch plans for the specific project from an API
    const samplePlans: Plan[] = [
      {
        id: '1',
        number: 'A-101',
        title: 'Ground Floor Plan',
        imageUrl: 'https://picsum.photos/400/300',
        projectId,
        category: 'Architectural',
        lastModified: '2 days ago',
        pdfUrl: '/uploads/sample.pdf'
      },
      {
        id: '2',
        number: 'A-102',
        title: 'First Floor Plan',
        imageUrl: 'https://picsum.photos/400/301',
        projectId,
        category: 'Architectural',
        lastModified: '3 days ago'
      },
      {
        id: '3',
        number: 'S-101',
        title: 'Foundation Plan',
        imageUrl: 'https://picsum.photos/400/302',
        projectId,
        category: 'Structural',
        lastModified: '1 week ago'
      },
    ];

    setPlans(samplePlans);
  }, [projectId]);

  const handleAddPlan = async (planData: {
    title: string;
    number: string;
    description: string;
    category: string;
    file: File | null;
  }) => {
    if (!planData.file) return;

    try {
      // Upload the PDF file
      const formData = new FormData();
      formData.append('file', planData.file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const { fileUrl } = await response.json();

      // Create new plan object
      const newPlan: Plan = {
        id: Math.random().toString(36).substr(2, 9),
        number: planData.number,
        title: planData.title,
        imageUrl: 'https://picsum.photos/400/300', // In a real app, generate thumbnail from PDF
        projectId,
        category: planData.category,
        lastModified: new Date().toISOString(),
        pdfUrl: fileUrl,
      };

      setPlans(prev => [...prev, newPlan]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding plan:', error);
      // Handle error (show error message to user)
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#333333]">Plans</h1>
          <p className="text-gray-500 mt-1">Manage and organize project plans</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <select className="px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm focus:outline-none focus:border-[#1a73e8]">
            <option>All Categories</option>
            <option>Architectural</option>
            <option>Structural</option>
            <option>MEP</option>
          </select>
          <button className="flex items-center px-3 py-2 border border-[#E0E0E0] rounded-lg text-sm hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Plans Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {/* Add Plan Card */}
        <div 
          onClick={() => setIsAddModalOpen(true)}
          className="border border-dashed border-[#E0E0E0] rounded-lg p-4 flex flex-col items-center justify-center h-[200px] hover:border-[#1a73e8] cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-[#1a73e8] bg-opacity-10 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <p className="text-[#1a73e8] font-medium">Add New Plan</p>
        </div>

        {/* Plan Cards */}
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => plan.pdfUrl && setSelectedPlan(plan)}
            className={`bg-white rounded-lg border border-[#E0E0E0] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
              viewMode === 'list' ? 'flex items-center' : ''
            }`}
          >
            <div
              className={`relative ${
                viewMode === 'grid' ? 'h-40' : 'w-48 h-32 flex-shrink-0'
              }`}
            >
              <Image
                src={plan.imageUrl}
                alt={plan.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{plan.number}</div>
                  <h3 className="font-medium text-[#333333]">{plan.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {plan.category}
                  </div>
                </div>
                <div className="text-sm text-gray-500">{plan.lastModified}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Modal */}
      {isAddModalOpen && (
        <AddPlanModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddPlan}
          categories={['Architectural', 'Structural', 'MEP']}
        />
      )}

      {/* PDF Viewer */}
      {selectedPlan && selectedPlan.pdfUrl && (
        <PDFViewer
          url={selectedPlan.pdfUrl}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
} 