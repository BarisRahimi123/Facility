'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Map,
  Upload,
  FileText,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

const steps = [
  { id: 1, title: 'Plan Details' },
  { id: 2, title: 'Upload Files' },
  { id: 3, title: 'Map Location' },
  { id: 4, title: 'Review' },
];

const planTemplates = [
  {
    id: '1',
    name: 'Foundation Plan',
    description: 'Template for foundation layout and details',
    thumbnail: 'https://picsum.photos/200/150',
  },
  {
    id: '2',
    name: 'Floor Plan',
    description: 'Standard floor plan template',
    thumbnail: 'https://picsum.photos/200/151',
  },
  {
    id: '3',
    name: 'Site Plan',
    description: 'Site layout and planning template',
    thumbnail: 'https://picsum.photos/200/152',
  },
];

export default function NewPlanPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    template: '',
    files: [],
    location: null,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8]"
                placeholder="Enter plan title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8] h-32 resize-none"
                placeholder="Enter plan description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateFormData('category', e.target.value)}
                className="w-full px-3 py-2 border border-[#E0E0E0] rounded-lg focus:outline-none focus:border-[#1a73e8]"
              >
                <option value="">Select category</option>
                <option value="architectural">Architectural</option>
                <option value="structural">Structural</option>
                <option value="mechanical">Mechanical</option>
                <option value="electrical">Electrical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Select Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => updateFormData('template', template.id)}
                    className={`border rounded-lg overflow-hidden cursor-pointer ${
                      formData.template === template.id
                        ? 'border-[#1a73e8] ring-2 ring-[#1a73e8] ring-opacity-50'
                        : 'border-[#E0E0E0]'
                    }`}
                  >
                    <div className="relative h-32">
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-[#E0E0E0] rounded-lg p-8">
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Plan Files</h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Drag and drop your files here, or click to select files
                </p>
                <button className="px-4 py-2 bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600">
                  Select Files
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Files
              </h4>
              <div className="space-y-2">
                {/* Sample uploaded file */}
                <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-[#1a73e8] mr-3" />
                    <div>
                      <div className="text-sm font-medium">plan-draft.pdf</div>
                      <div className="text-xs text-gray-500">2.4 MB</div>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-100 rounded-lg h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Map integration coming soon</p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Review Plan Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Title</div>
                  <div className="font-medium">{formData.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Description</div>
                  <div className="font-medium">{formData.description}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium capitalize">{formData.category}</div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.id === currentStep
                      ? 'bg-[#1a73e8] text-white'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <div
                  className={`ml-3 text-sm ${
                    step.id === currentStep
                      ? 'text-[#1a73e8] font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E0E0E0] p-6">
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E0E0E0]">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              className={`px-4 py-2 text-sm border border-[#E0E0E0] rounded-lg hover:bg-gray-50 ${
                currentStep === 1 ? 'invisible' : ''
              }`}
            >
              Previous
            </button>
            <button
              onClick={() =>
                currentStep < 4
                  ? setCurrentStep((prev) => prev + 1)
                  : console.log('Submit form')
              }
              className="px-4 py-2 text-sm bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600"
            >
              {currentStep === 4 ? 'Create Plan' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 