'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, FileText } from 'lucide-react';
import { uploadDocument } from '@/app/actions/documents';
import toast from 'react-hot-toast';

interface UploadFacilityDocumentModalProps {
  facilityId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function UploadFacilityDocumentModal({ facilityId, onClose, onSuccess }: UploadFacilityDocumentModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill document name from file name (without extension)
      if (!documentName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill document name from file name (without extension)
      if (!documentName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !documentName) {
      toast.error('Please select a file and provide a name');
      return;
    }

    console.log('Uploading document:', {
      facilityId,
      documentName,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type
    });

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('facilityId', facilityId);
      formData.append('name', documentName);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('tags', tags);
      formData.append('file', selectedFile);

      const result = await uploadDocument(formData);
      
      if (result.error) {
        console.error('Upload error:', result.error);
        toast.error(result.error);
      } else {
        console.log('Upload successful:', result);
        toast.success('Document uploaded successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Upload exception:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.png,.jpg,.jpeg,.gif,.svg,.zip,.rar"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-foreground font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Click to select or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, XLS, PPT, Images, ZIP (max 50MB)
                </p>
              </>
            )}
          </div>

          {/* Document Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">Document Name *</Label>
              <Input
                id="name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
                className="bg-input border-border text-foreground placeholder-muted-foreground"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter document description"
                className="bg-input border-border text-foreground placeholder-muted-foreground"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-foreground">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="General" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">General</SelectItem>
                  <SelectItem value="Blueprints" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Blueprints</SelectItem>
                  <SelectItem value="Contracts" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Contracts</SelectItem>
                  <SelectItem value="Permits" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Permits</SelectItem>
                  <SelectItem value="Reports" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Reports</SelectItem>
                  <SelectItem value="Manuals" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Manuals</SelectItem>
                  <SelectItem value="Other" className="text-popover-foreground focus:bg-accent focus:text-accent-foreground">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags" className="text-foreground">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="bg-input border-border text-foreground placeholder-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple tags with commas (e.g., "important, 2024, renovation")
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !documentName || isUploading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}  