'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Calendar,
  Tag,
  Hash,
  ArrowLeft,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import UploadEmergencyDocumentModal from './UploadEmergencyDocumentModal';
import { getEmergencyDocuments, deleteEmergencyDocument, EmergencyDocument as EmergencyDocumentType } from '@/app/actions/emergencyDocuments';

// Use the type from server actions but with camelCase for UI
interface EmergencyDocument {
  id: string;
  name: string;
  description: string;
  category: string;
  documentType: string;
  version: string;
  tags: string[];
  effectiveDate: string;
  expirationDate: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

interface EmergencyDocumentsViewProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  category: 'emergency_plan' | 'evacuation_routes' | 'emergency_contacts' | 'equipment' | 'life_safety' | 'floor_plans';
  categoryName: string;
  categoryIcon: React.ReactNode;
  categoryColor: string;
}

// Mock data - replace with actual API calls
const mockDocuments: Record<string, EmergencyDocument[]> = {
  emergency_plan: [
    {
      id: '1',
      name: 'Emergency Response Plan 2024',
      description: 'Comprehensive emergency response procedures for all facility emergencies',
      category: 'emergency_plan',
      documentType: 'Emergency Response Plan',
      version: '2.1',
      tags: ['Critical', 'Annual Review', 'Fire Safety'],
      effectiveDate: '2024-01-01',
      expirationDate: '2024-12-31',
      fileUrl: '/docs/emergency-response-plan-2024.pdf',
      fileSize: 2500000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }
  ],
  evacuation_routes: [],
  emergency_contacts: [
    {
      id: '2',
      name: 'Emergency Contact Directory',
      description: 'Updated contact list for all emergency personnel and external services',
      category: 'emergency_contacts',
      documentType: 'Contact List',
      version: '1.3',
      tags: ['Critical', 'Quarterly Update'],
      effectiveDate: '2024-01-01',
      expirationDate: '2024-03-31',
      fileUrl: '/docs/emergency-contacts-2024.pdf',
      fileSize: 850000,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-10T00:00:00Z'
    }
  ],
  equipment: [],
  life_safety: [],
  floor_plans: []
};

export default function EmergencyDocumentsView({
  isOpen,
  onClose,
  facilityId,
  category,
  categoryName,
  categoryIcon,
  categoryColor
}: EmergencyDocumentsViewProps) {
  const [documents, setDocuments] = useState<EmergencyDocument[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, category]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getEmergencyDocuments(facilityId, category);
      
      // Convert server response to UI format
      const formattedDocs: EmergencyDocument[] = docs.map((doc: EmergencyDocumentType) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description || '',
        category: doc.category,
        documentType: doc.document_type,
        version: doc.version,
        tags: doc.tags || [],
        effectiveDate: doc.effective_date,
        expirationDate: doc.expiration_date,
        fileUrl: doc.file_url,
        fileSize: doc.file_size,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));
      
      setDocuments(formattedDocs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadDocuments();
    setIsUploadModalOpen(false);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await deleteEmergencyDocument(documentId);
      
      if (response.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        console.error('Failed to delete document:', response.error);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || doc.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(documents.flatMap(doc => doc.tags)));

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    return expDate < today;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-gray-800 pb-4">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1 hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className={`p-2 rounded-lg ${categoryColor}`}>
                {categoryIcon}
              </div>
              {categoryName} Documents
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage emergency documentation for {categoryName.toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-800">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                
                {allTags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={selectedTag || ''}
                      onChange={(e) => setSelectedTag(e.target.value || null)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm text-white"
                    >
                      <option value="">All Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((document) => (
                  <Card key={document.id} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-gray-700/50 rounded-lg">
                            <FileText className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white truncate">{document.name}</h3>
                              <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                                v{document.version}
                              </Badge>
                              {isExpired(document.expirationDate) && (
                                <Badge variant="destructive" className="text-xs">
                                  Expired
                                </Badge>
                              )}
                              {isExpiringSoon(document.expirationDate) && !isExpired(document.expirationDate) && (
                                <Badge variant="outline" className="text-xs text-amber-400 border-amber-600">
                                  Expires Soon
                                </Badge>
                              )}
                            </div>
                            
                            {document.description && (
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{document.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(document.effectiveDate)}
                              </span>
                              <span>•</span>
                              <span>{document.documentType}</span>
                              <span>•</span>
                              <span>{formatFileSize(document.fileSize)}</span>
                            </div>
                            
                            {document.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <Tag className="h-3 w-3 text-gray-500" />
                                <div className="flex flex-wrap gap-1">
                                  {document.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-950/50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-green-400 hover:bg-green-950/50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className={`inline-flex p-4 rounded-full ${categoryColor} mb-4`}>
                    {categoryIcon}
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No documents yet</h3>
                  <p className="text-gray-400 mb-6">
                    Upload your first {categoryName.toLowerCase()} document to get started.
                  </p>
                  <Button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <UploadEmergencyDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        facilityId={facilityId}
        category={category}
        categoryName={categoryName}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
} 