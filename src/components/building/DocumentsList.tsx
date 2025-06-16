'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Archive,
  Filter,
  Printer
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { deleteDocument } from '@/app/actions/documents';
import toast from 'react-hot-toast';
import { UploadDocumentModal } from '@/components/building/UploadDocumentModal';
import { EditDocumentModal } from '@/components/building/EditDocumentModal';

interface Document {
  id: string;
  building_id: string;
  name: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  description?: string;
  category?: string;
  tags?: string[];
  version?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsListProps {
  buildingId: string;
  documents: Document[];
  onDocumentsChange?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (fileType.includes('image')) return <Image className="h-5 w-5 text-green-500" />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <Presentation className="h-5 w-5 text-orange-500" />;
  if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-5 w-5 text-purple-500" />;
  if (fileType.includes('code') || fileType.includes('json') || fileType.includes('xml')) return <FileCode className="h-5 w-5 text-blue-500" />;
  return <File className="h-5 w-5 text-gray-500" />;
};

const getTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

export function DocumentsList({ buildingId, documents, onDocumentsChange }: DocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(documents);

  useEffect(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, categoryFilter]);

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      return;
    }

    try {
      const result = await deleteDocument(doc.id, doc.file_url);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Document deleted successfully');
        onDocumentsChange?.();
      }
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setShowEditModal(true);
  };

  const handleView = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handlePrint = (doc: Document) => {
    const printWindow = window.open(doc.file_url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-gray-800 border-gray-700 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all" className="text-white hover:bg-gray-700">All Categories</SelectItem>
            <SelectItem value="General" className="text-white hover:bg-gray-700">General</SelectItem>
            <SelectItem value="Blueprints" className="text-white hover:bg-gray-700">Blueprints</SelectItem>
            <SelectItem value="Contracts" className="text-white hover:bg-gray-700">Contracts</SelectItem>
            <SelectItem value="Permits" className="text-white hover:bg-gray-700">Permits</SelectItem>
            <SelectItem value="Reports" className="text-white hover:bg-gray-700">Reports</SelectItem>
            <SelectItem value="Manuals" className="text-white hover:bg-gray-700">Manuals</SelectItem>
            <SelectItem value="Other" className="text-white hover:bg-gray-700">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents list */}
      {filteredDocuments.length > 0 ? (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{doc.name}</h3>
                    {doc.description && (
                      <p className="text-sm text-gray-400 mt-1">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{getTimeAgo(doc.created_at)}</span>
                      {doc.category && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {doc.category}
                          </Badge>
                        </>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">
                            {doc.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                                +{doc.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleView(doc)}
                      className="h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600 text-white border-0"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(doc)}
                      className="h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600 text-white border-0"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handlePrint(doc)}
                      className="h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600 text-white border-0"
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(doc)}
                      className="h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600 text-white border-0"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(doc)}
                      className="h-8 w-8 p-0 bg-red-600 hover:bg-red-500 text-white border-0"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-white">No documents found</h3>
            <p className="mt-2 text-gray-400">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Upload your first document to get started'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <div className="mt-6">
                <Button 
                  onClick={() => setShowUploadModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadDocumentModal
          buildingId={buildingId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            onDocumentsChange?.();
          }}
        />
      )}

      {showEditModal && selectedDocument && (
        <EditDocumentModal
          document={selectedDocument}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
            onDocumentsChange?.();
          }}
        />
      )}
    </div>
  );
} 