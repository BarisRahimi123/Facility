import { 
  FileText, 
  Download, 
  History, 
  Share2, 
  Edit, 
  Trash2, 
  Clock, 
  Users,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpecificationPreviewProps {
  specification: {
    id: string;
    name: string;
    category: string;
    lastUpdated: string;
    version: string;
    status: 'Published' | 'Draft' | 'Under Review';
    author: string;
    collaborators: number;
    description?: string;
  };
  onClose: () => void;
}

export default function SpecificationPreview({
  specification,
  onClose,
}: SpecificationPreviewProps) {
  return (
    <div className="h-full border-l border-[#E0E0E0] w-96 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
        <h2 className="text-lg font-semibold text-gray-900">Specification Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#1a73e8]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{specification.name}</h3>
            <p className="text-sm text-gray-500">Version {specification.version}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              specification.status === 'Published' ? 'bg-green-100 text-green-800' :
              specification.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {specification.status}
            </span>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Category</label>
            <p className="mt-1 text-sm text-gray-900">{specification.category}</p>
          </div>

          {specification.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-sm text-gray-900">{specification.description}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <div className="mt-1 flex items-center text-sm text-gray-900">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                {specification.lastUpdated}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Collaborators</label>
              <div className="mt-1 flex items-center text-sm text-gray-900">
                <Users className="w-4 h-4 mr-1 text-gray-400" />
                {specification.collaborators}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500">Author</label>
            <p className="mt-1 text-sm text-gray-900">{specification.author}</p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          
          <Button
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>

          <Button
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
          >
            <History className="w-4 h-4" />
            View History
          </Button>

          <div className="flex gap-3">
            <Button
              className="flex-1 flex items-center justify-center gap-2"
              variant="outline"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            
            <Button
              className="flex-1 flex items-center justify-center gap-2 !bg-red-50 !text-red-600 hover:!bg-red-100 border-red-200"
              variant="outline"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 