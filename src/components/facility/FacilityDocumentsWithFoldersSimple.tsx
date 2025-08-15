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
  Edit2,
  Trash2, 
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Archive,
  FolderPlus,
  Folder,
  FolderOpen,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { deleteDocument } from '@/app/actions/documents';
import { getFolders, getFolderDocuments, deleteFolder, type DocumentFolder } from '@/app/actions/documentFolders';
import { useToast } from '@/components/ui/use-toast';
import { UploadFacilityDocumentModal } from './UploadFacilityDocumentModal';
import { EditDocumentModal } from '../building/EditDocumentModal';
import { CreateFolderModal } from './CreateFolderModal';
import { EditFolderModal } from './EditFolderModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Import helper functions
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
  return <File className="h-5 w-5 text-muted-foreground" />;
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

interface Document {
  id: string;
  building_id?: string;
  facility_id?: string;
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
  folder_id?: string;
}

interface FacilityDocumentsWithFoldersSimpleProps {
  facilityId: string;
  documents: Document[];
  onDocumentsChange?: () => void;
}

export function FacilityDocumentsWithFoldersSimple({ facilityId, documents, onDocumentsChange }: FacilityDocumentsWithFoldersSimpleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DocumentFolder | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<DocumentFolder | null>(null);
  
  // Navigation state
  const [currentFolder, setCurrentFolder] = useState<DocumentFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<DocumentFolder[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [currentDocuments, setCurrentDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Load folders and documents based on current location
  useEffect(() => {
    loadFoldersAndDocuments();
  }, [facilityId, currentFolder]);

  const loadFoldersAndDocuments = async () => {
    setIsLoading(true);
    try {
      if (currentFolder) {
        // Load documents for current folder
        const folderDocData = await getFolderDocuments(currentFolder.id);
        setFolders([]);
        setCurrentDocuments(folderDocData);
      } else {
        // Load top-level folders and unorganized documents
        const folderData = await getFolders(facilityId, 'facility');
        const unorganizedDocs = documents.filter(doc => !doc.folder_id);
        setFolders(folderData);
        setCurrentDocuments(unorganizedDocs);
      }
    } catch (error) {
      console.error('Error loading folders and documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folders and documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: DocumentFolder) => {
    setBreadcrumbs(prev => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const handleEditFolder = (folder: DocumentFolder) => {
    setSelectedFolder(folder);
    setShowEditFolderModal(true);
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const result = await deleteFolder(folderToDelete.id);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Folder deleted successfully',
        });
        loadFoldersAndDocuments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteFolderDialog(false);
      setFolderToDelete(null);
    }
  };

  const handleBackClick = () => {
    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1] || null);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      // Root
      setBreadcrumbs([]);
      setCurrentFolder(null);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(newBreadcrumbs[index]);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    try {
      const result = await deleteDocument(doc.id, doc.file_url);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });
        onDocumentsChange?.();
        loadFoldersAndDocuments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  // Filter documents based on search and category
  const filteredDocuments = currentDocuments.filter(doc => {
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    if (categoryFilter !== 'all' && doc.category !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with breadcrumbs and actions */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => handleBreadcrumbClick(-1)}
            className="text-primary hover:text-primary/80 font-medium"
          >
            Documents
          </button>
          {breadcrumbs.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2">
            {currentFolder && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolderModal(true)}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-input border-border text-foreground">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Folders</h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folders.map((folder) => (
                  <Card 
                    key={folder.id} 
                    className="bg-card/50 border-border hover:bg-card transition-all duration-200 hover:shadow-sm group relative"
                  >
                    <CardContent className="p-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleFolderClick(folder)}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: folder.color + '20', color: folder.color }}
                        >
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {folder.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {folder.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem 
                            className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFolderClick(folder);
                            }}
                          >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFolder(folder);
                            }}
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border" />
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToDelete(folder);
                              setShowDeleteFolderDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {filteredDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Documents {currentFolder ? `in ${currentFolder.name}` : '(Unorganized)'}
              </h3>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc) => (
                  <Card key={doc.id} className="bg-card/50 border-border hover:bg-card transition-all duration-200 hover:shadow-sm group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-1">
                            {getFileIcon(doc.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {doc.name}
                            </h4>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {doc.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                {doc.category || 'General'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(doc.created_at)}
                              </span>
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {doc.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-border text-muted-foreground">
                                    {tag}
                                  </Badge>
                                ))}
                                {doc.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                    +{doc.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem 
                              className="text-foreground focus:bg-accent focus:text-accent-foreground"
                              onClick={() => window.open(doc.file_url, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-foreground focus:bg-accent focus:text-accent-foreground"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.file_url;
                                link.download = doc.file_name;
                                link.click();
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-foreground focus:bg-accent focus:text-accent-foreground"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setShowEditModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => handleDeleteDocument(doc)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {folders.length === 0 && filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {currentFolder ? 'This folder is empty' : 'No documents yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {currentFolder 
                  ? 'Start organizing by uploading documents.'
                  : 'Start organizing your documents by creating folders or uploading files.'
                }
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateFolderModal(true)}
                  className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </Button>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadFacilityDocumentModal
          facilityId={facilityId}
          folderId={currentFolder?.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            onDocumentsChange?.();
            loadFoldersAndDocuments();
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
            loadFoldersAndDocuments();
          }}
        />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onSuccess={() => {
            setShowCreateFolderModal(false);
            loadFoldersAndDocuments();
          }}
          entityId={facilityId}
          entityType="facility"
          parentFolderId={currentFolder?.id}
        />
      )}

      {showEditFolderModal && selectedFolder && (
        <EditFolderModal
          isOpen={showEditFolderModal}
          onClose={() => {
            setShowEditFolderModal(false);
            setSelectedFolder(null);
          }}
          onSuccess={() => {
            setShowEditFolderModal(false);
            setSelectedFolder(null);
            loadFoldersAndDocuments();
          }}
          folder={selectedFolder}
        />
      )}

      <AlertDialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Folder</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete the folder "{folderToDelete?.name}"? 
              This action cannot be undone. All documents in this folder will become unorganized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setShowDeleteFolderDialog(false);
                setFolderToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={handleDeleteFolder}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
