'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from 'lucide-react';
import { updateDocument } from '@/app/actions/documents';
import { useToast } from '@/components/ui/use-toast';

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

interface EditDocumentModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditDocumentModal({ document, isOpen, onClose }: EditDocumentModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    tags: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name,
        description: document.description || '',
        category: document.category || 'General',
        tags: document.tags.join(', ')
      });
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSaving(true);

    const data = new FormData();
    data.append('documentId', document.id);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('tags', formData.tags);

    const result = await updateDocument(data);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });
      onClose();
    }

    setSaving(false);
  };

  const categories = ['General', 'Blueprints', 'Contracts', 'Reports', 'Permits', 'Maintenance', 'Other'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Edit Document</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the document details. The file itself cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-300">File</Label>
            <p className="mt-1 text-sm text-gray-400">
              {document.file_name} ({(document.file_size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>

          <div>
            <Label htmlFor="name" className="text-gray-300">Document Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
              disabled={saving}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-gray-300">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              disabled={saving}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {categories.map(category => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    className="text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the document"
              rows={3}
              disabled={saving}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-gray-300">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="Comma-separated tags (e.g., important, 2024, safety)"
              disabled={saving}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 