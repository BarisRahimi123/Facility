'use client';

import { Star, MoreVertical, Users, MapPin, FileText, CheckSquare, Building2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    location: string;
    status: string;
    lastVisited: string;
    thumbnail: File | null;
    thumbnailUrl?: string | null;
    members: number;
    plansCount: number;
    tasksCount: number;
    isStarred: boolean;
    progress?: number;
    constructionType?: string;
    squareFootage?: number;
    numberOfBuildings?: number;
    projectManager?: string;
    createdDate?: string;
  };
  onStar?: (id: string) => void;
  view?: 'grid' | 'list';
}

export default function ProjectCard({ project, onStar, view = 'grid' }: ProjectCardProps) {
  const router = useRouter();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (project.thumbnail instanceof File) {
      const url = URL.createObjectURL(project.thumbnail);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setObjectUrl(null);
      };
    } else {
      setObjectUrl(null);
    }
  }, [project.thumbnail]);

  const handleClick = () => {
    router.push(`/plans`);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStar) {
      onStar(project.id);
    }
  };

  if (view === 'list') {
    return (
      <div 
        onClick={handleClick}
        className="bg-white rounded-lg border border-[#E0E0E0] p-6 hover:shadow-lg transition-shadow cursor-pointer"
      >
        <div className="flex gap-6">
          {/* Thumbnail */}
          <div className="relative w-32 h-32 flex-shrink-0">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={project.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : objectUrl ? (
              <img
                src={objectUrl}
                alt={project.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Project Information */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">{project.title}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-1" />
                  {project.location || 'No location set'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  project.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' :
                  project.status === 'completed' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' :
                  project.status === 'on-hold' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' :
                  'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
                }`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                <button
                  onClick={handleStarClick}
                  className={`p-1.5 rounded-full hover:bg-gray-100 ${
                    project.isStarred ? 'text-yellow-400' : 'text-gray-400'
                  }`}
                >
                  <Star className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-3 gap-4">
              {/* Team & Activity */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{project.members} team members</span>
                </div>
                <div className="flex items-center text-sm">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{project.plansCount} plans</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckSquare className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-600">{project.tasksCount} tasks</span>
                </div>
              </div>

              {/* Project Stats */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Construction Type:</span>
                  <span className="ml-2 text-gray-900">{project.constructionType || 'Not set'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Square Footage:</span>
                  <span className="ml-2 text-gray-900">{project.squareFootage?.toLocaleString() || 'Not set'} sq ft</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Buildings:</span>
                  <span className="ml-2 text-gray-900">{project.numberOfBuildings || '0'}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Project Manager:</span>
                  <span className="ml-2 text-gray-900">{project.projectManager || 'Not assigned'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Start Date:</span>
                  <span className="ml-2 text-gray-900">{project.createdDate ? new Date(project.createdDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Last Activity:</span>
                  <span className="ml-2 text-gray-900">{project.lastVisited}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg border border-[#E0E0E0] hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-48">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : objectUrl ? (
          <img
            src={objectUrl}
            alt={project.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 rounded-t-lg flex items-center justify-center">
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-lg truncate">{project.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {project.location}
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleStarClick}
              className={`p-1 rounded-full hover:bg-gray-100 ${
                project.isStarred ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              <Star className="w-5 h-5" />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {project.members}
          </div>
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            {project.plansCount} plans
          </div>
          <div className="flex items-center">
            <CheckSquare className="w-4 h-4 mr-1" />
            {project.tasksCount} tasks
          </div>
        </div>
      </div>
    </div>
  );
} 