'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createFolder } from '@/app/actions/documentFolders';
import { useToast } from '@/components/ui/use-toast';
import { 
  Folder, 
  FileText, 
  Wrench, 
  Shield, 
  DollarSign, 
  Home, 
  Users, 
  BookOpen,
  Package,
  Settings,
  Archive,
  Image,
  Video,
  Music
} from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityId: string;
  entityType: 'building' | 'facility';
  parentFolderId?: string;
}

const folderIcons = [
  { name: 'folder', icon: Folder, label: 'Default Folder' },
  { name: 'file-text', icon: FileText, label: 'Documents' },
  { name: 'wrench', icon: Wrench, label: 'Maintenance' },
  { name: 'shield', icon: Shield, label: 'Safety & Security' },
  { name: 'dollar-sign', icon: DollarSign, label: 'Financial' },
  { name: 'home', icon: Home, label: 'Building Plans' },
  { name: 'users', icon: Users, label: 'Vendor/Staff' },
  { name: 'book-open', icon: BookOpen, label: 'Training' },
  { name: 'package', icon: Package, label: 'Equipment' },
  { name: 'settings', icon: Settings, label: 'Operations' },
  { name: 'archive', icon: Archive, label: 'Archives' },
  { name: 'image', icon: Image, label: 'Images' },
  { name: 'video', icon: Video, label: 'Media' },
  { name: 'music', icon: Music, label: 'Audio' },
];

const folderColors = [
  { name: 'Blue', value: '#007aff' },
  { name: 'Green', value: '#00b16a' },
  { name: 'Red', value: '#ff3b30' },
  { name: 'Orange', value: '#ff9500' },
  { name: 'Purple', value: '#5856d6' },
  { name: 'Pink', value: '#ff2d92' },
  { name: 'Teal', value: '#32d74b' },
  { name: 'Indigo', value: '#af52de' },
  { name: 'Yellow', value: '#ffcc02' },
  { name: 'Gray', value: '#8e8e93' },
];

export function CreateFolderModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  entityId, 
  entityType, 
  parentFolderId 
}: CreateFolderModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#007aff',
    icon: 'folder',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createFolder(entityId, entityType, {
        ...formData,
        parent_folder_id: parentFolderId,
      });

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Folder created successfully',
        });
        setFormData({ name: '', description: '', color: '#007aff', icon: 'folder' });
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIcon = folderIcons.find(icon => icon.name === formData.icon);
  const selectedColor = folderColors.find(color => color.value === formData.color);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Folder</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new folder to organize your documents. {parentFolderId ? 'This will be created as a subfolder.' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Folder Preview */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: formData.color + '20', color: formData.color }}
            >
              {selectedIcon && <selectedIcon.icon className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">
                {formData.name || 'New Folder'}
              </div>
              <div className="text-sm text-muted-foreground">
                {formData.description || 'Folder description'}
              </div>
            </div>
          </div>

          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Folder Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter folder name"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of folder contents"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">Folder Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {selectedIcon && <selectedIcon.icon className="w-4 h-4" />}
                    {selectedIcon?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {folderIcons.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name}>
                    <div className="flex items-center gap-2">
                      <icon.icon className="w-4 h-4" />
                      {icon.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">Folder Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {folderColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.color === color.value 
                      ? 'border-foreground shadow-md scale-105' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Selected: {selectedColor?.name || 'Custom'}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





