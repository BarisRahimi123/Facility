'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDocument } from '@/app/actions/documents';
import toast from 'react-hot-toast';

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

interface EditDocumentModalProps {
  document: Document;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDocumentModal({ document, onClose, onSuccess }: EditDocumentModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [documentName, setDocumentName] = useState(document.name);
  const [description, setDescription] = useState(document.description || '');
  const [category, setCategory] = useState(document.category || 'General');
  const [tags, setTags] = useState(document.tags?.join(', ') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentName) {
      toast.error('Document name is required');
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('documentId', document.id);
      formData.append('name', documentName);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('tags', tags);

      const result = await updateDocument(formData);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Document updated successfully');
        onSuccess();
      }
    } catch (error) {
      toast.error('Failed to update document');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Info (Read-only) */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-300 mb-1 font-medium">Current File</p>
            <p className="text-white font-medium">{document.file_name}</p>
            <p className="text-xs text-gray-400 mt-2">
              You cannot change the file. To upload a new version, delete this document and upload a new one.
            </p>
          </div>

          {/* Document Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white font-medium mb-2 block">Document Name *</Label>
              <Input
                id="name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white font-medium mb-2 block">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter document description"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-white font-medium mb-2 block">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="General" className="text-white hover:bg-gray-700 focus:bg-gray-700">General</SelectItem>
                  <SelectItem value="Blueprints" className="text-white hover:bg-gray-700 focus:bg-gray-700">Blueprints</SelectItem>
                  <SelectItem value="Contracts" className="text-white hover:bg-gray-700 focus:bg-gray-700">Contracts</SelectItem>
                  <SelectItem value="Permits" className="text-white hover:bg-gray-700 focus:bg-gray-700">Permits</SelectItem>
                  <SelectItem value="Reports" className="text-white hover:bg-gray-700 focus:bg-gray-700">Reports</SelectItem>
                  <SelectItem value="Manuals" className="text-white hover:bg-gray-700 focus:bg-gray-700">Manuals</SelectItem>
                  <SelectItem value="Other" className="text-white hover:bg-gray-700 focus:bg-gray-700">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tags" className="text-white font-medium mb-2 block">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Separate multiple tags with commas (e.g., "important, 2024, renovation")
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!documentName || isUpdating}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              {isUpdating ? 'Updating...' : 'Update Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}  