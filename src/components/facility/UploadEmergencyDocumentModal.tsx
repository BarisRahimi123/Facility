'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, FileText, Tag, Hash, Calendar } from 'lucide-react';
import { uploadEmergencyDocument } from '@/app/actions/emergencyDocuments';

interface UploadEmergencyDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  category: 'emergency_plan' | 'evacuation_routes' | 'emergency_contacts' | 'equipment' | 'life_safety' | 'floor_plans';
  categoryName: string;
  onSuccess?: () => void;
}

interface EmergencyDocument {
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  file: File | null;
  effectiveDate: string;
  expirationDate: string;
  documentType: string;
}

const documentTypes = {
  emergency_plan: [
    'Emergency Response Plan',
    'Business Continuity Plan',
    'Crisis Management Plan',
    'Incident Response Plan',
    'Risk Assessment'
  ],
  evacuation_routes: [
    'Evacuation Map',
    'Assembly Point Layout',
    'Exit Route Diagram',
    'Emergency Exits Plan',
    'Accessibility Routes'
  ],
  emergency_contacts: [
    'Contact List',
    'Emergency Phone Tree',
    'Key Personnel Directory',
    'External Contacts',
    'Vendor Contacts'
  ],
  equipment: [
    'Equipment Inventory',
    'Maintenance Schedule',
    'Equipment Manual',
    'Inspection Report',
    'Certification Document'
  ],
  life_safety: [
    'Fire Safety Certificate',
    'Building Permit',
    'Safety Inspection Report',
    'Compliance Certificate',
    'Training Records'
  ],
  floor_plans: [
    'Emergency Floor Plan',
    'Fire Safety Plan',
    'Evacuation Layout',
    'Assembly Area Map',
    'Emergency Equipment Layout'
  ]
};

const commonTags = [
  'Critical', 'Annual Review', 'Quarterly Update', 'Training Required',
  'Compliance', 'Fire Safety', 'Medical', 'Security', 'Weather Emergency',
  'Earthquake', 'Active Shooter', 'Chemical Spill', 'Power Outage'
];

export default function UploadEmergencyDocumentModal({
  isOpen,
  onClose,
  facilityId,
  category,
  categoryName,
  onSuccess
}: UploadEmergencyDocumentModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [documentData, setDocumentData] = useState<EmergencyDocument>({
    name: '',
    description: '',
    category: category,
    tags: [],
    version: '1.0',
    file: null,
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    documentType: ''
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDocumentData({
        name: '',
        description: '',
        category: category,
        tags: [],
        version: '1.0',
        file: null,
        effectiveDate: new Date().toISOString().split('T')[0],
        expirationDate: '',
        documentType: ''
      });
      setTagInput('');
    }
  }, [isOpen, category]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload PDF, Word, Image, or Text files only.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload files smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setDocumentData(prev => ({
      ...prev,
      file: file,
      name: prev.name || file.name.replace(/\.[^/.]+$/, '') // Use filename if name is empty
    }));
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !documentData.tags.includes(trimmedTag)) {
      setDocumentData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setDocumentData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form
      if (!documentData.name || !documentData.file || !documentData.documentType) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', documentData.file);
      formData.append('name', documentData.name);
      formData.append('description', documentData.description);
      formData.append('category', documentData.category);
      formData.append('documentType', documentData.documentType);
      formData.append('version', documentData.version);
      formData.append('tags', JSON.stringify(documentData.tags));
      formData.append('effectiveDate', documentData.effectiveDate);
      formData.append('expirationDate', documentData.expirationDate);
      formData.append('facilityId', facilityId);

      // Upload to server
      const response = await uploadEmergencyDocument(formData);
      
      if (!response.success) {
        throw new Error(response.error || 'Upload failed');
      }
      
      toast({
        title: 'Document Uploaded',
        description: `${documentData.name} has been uploaded successfully.`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-5 w-5 text-purple-400" />
            Upload {categoryName} Document
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload emergency documentation with proper categorization and versioning
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-purple-400 bg-purple-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {documentData.file ? (
              <div className="flex items-center justify-center space-x-3">
                <FileText className="h-8 w-8 text-green-400" />
                <div className="text-left">
                  <p className="font-medium text-white">{documentData.file.name}</p>
                  <p className="text-sm text-gray-400">
                    {(documentData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumentData(prev => ({ ...prev, file: null }))}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">Drag and drop your file here, or click to browse</p>
                <p className="text-sm text-gray-500">PDF, Word, Image, or Text files up to 10MB</p>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-block cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Document Name *</Label>
              <Input
                id="name"
                value={documentData.name}
                onChange={(e) => setDocumentData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Emergency Response Plan 2024"
                required
              />
            </div>

            <div>
              <Label htmlFor="version" className="text-gray-300">Version *</Label>
              <Input
                id="version"
                value={documentData.version}
                onChange={(e) => setDocumentData(prev => ({ ...prev, version: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="1.0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="documentType" className="text-gray-300">Document Type *</Label>
            <Select
              value={documentData.documentType}
              onValueChange={(value) => setDocumentData(prev => ({ ...prev, documentType: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {documentTypes[category]?.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={documentData.description}
              onChange={(e) => setDocumentData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
              placeholder="Brief description of the document..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveDate" className="text-gray-300">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={documentData.effectiveDate}
                onChange={(e) => setDocumentData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="expirationDate" className="text-gray-300">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={documentData.expirationDate}
                onChange={(e) => setDocumentData(prev => ({ ...prev, expirationDate: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label className="text-gray-300">Tags</Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {documentData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-purple-500 text-purple-300 flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="h-auto p-0 ml-1 text-purple-300 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyPress}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Type a tag and press Enter"
              />
              
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-400">Common tags:</span>
                {commonTags.slice(0, 6).map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTag(tag)}
                    className="h-6 px-2 text-xs text-gray-400 hover:text-purple-300 border border-gray-600 hover:border-purple-500"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || !documentData.file}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {isLoading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 