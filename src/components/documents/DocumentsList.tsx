'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Edit, Trash2, Eye, Printer, Upload, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { deleteDocument, getDocuments } from '@/app/actions/documents';
import UploadDocumentModal from './UploadDocumentModal';
import EditDocumentModal from './EditDocumentModal';
import DocumentModal from './DocumentModal';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  name: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  description?: string;
  category: string;
  tags: string[];
  version: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsListProps {
  buildingId: string;
}

export default function DocumentsList({ buildingId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [buildingId]);

  const loadDocuments = async () => {
    setLoading(true);
    const docs = await getDocuments(buildingId);
    setDocuments(docs);
    setLoading(false);
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      return;
    }

    const result = await deleteDocument(doc.id, doc.file_url);
    if (result.success) {
      toast({
        title: 'Document deleted',
        description: 'The document has been successfully deleted.',
      });
      loadDocuments();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('document') || fileType.includes('word')) return '📝';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📈';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'General', 'Blueprints', 'Contracts', 'Reports', 'Permits', 'Maintenance', 'Other'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Documents</CardTitle>
            <Button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-gray-900 border-gray-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {categories.map(category => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    className="text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          {filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 rounded-lg border border-gray-700 bg-gray-900 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="text-2xl">{getFileIcon(doc.file_type)}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{doc.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {doc.file_name} • {formatFileSize(doc.file_size)} • v{doc.version}
                        </p>
                        {doc.description && (
                          <p className="text-sm text-gray-500 mt-2">{doc.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {doc.category}
                          </Badge>
                          {doc.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                              {tag}
                            </Badge>
                          ))}
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingDocument(doc)}
                        className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const a = window.document.createElement('a');
                          a.href = doc.file_url;
                          a.download = doc.file_name;
                          window.document.body.appendChild(a);
                          a.click();
                          window.document.body.removeChild(a);
                        }}
                        className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const printWindow = window.open(doc.file_url, '_blank');
                          if (printWindow) {
                            printWindow.onload = () => {
                              printWindow.print();
                            };
                          }
                        }}
                        className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDocument(doc)}
                        className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc)}
                        className="border-gray-700 text-red-400 hover:bg-red-950 hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-600" />
              <h3 className="mt-2 text-sm font-medium text-gray-300">
                {searchTerm || categoryFilter !== 'all' ? 'No documents found' : 'No documents'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filter.' 
                  : 'Get started by uploading a document.'}
              </p>
              {!searchTerm && categoryFilter === 'all' && (
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload First Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <UploadDocumentModal
        buildingId={buildingId}
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          loadDocuments();
        }}
      />

      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          isOpen={!!editingDocument}
          onClose={() => {
            setEditingDocument(null);
            loadDocuments();
          }}
        />
      )}

      <DocumentModal
        document={viewingDocument ? {
          id: viewingDocument.id,
          name: viewingDocument.name,
          description: viewingDocument.description,
          file_url: viewingDocument.file_url,
          file_type: viewingDocument.file_type,
          file_size: viewingDocument.file_size,
          uploaded_at: viewingDocument.created_at,
          version: viewingDocument.version.toString(),
          tags: viewingDocument.tags
        } : null}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
      />
    </>
  );
} 