'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateFolder, type DocumentFolder } from '@/app/actions/documentFolders';
import { useToast } from '@/components/ui/use-toast';
import { Folder, FolderOpen, FileText, Shield, DollarSign, Map, Users, Briefcase, BookOpen, Settings, Archive, Package } from 'lucide-react';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  folder: DocumentFolder;
}

const folderColors = [
  { value: '#007aff', label: 'Blue', className: 'bg-blue-500' },
  { value: '#00b16a', label: 'Green', className: 'bg-green-500' },
  { value: '#ff3b30', label: 'Red', className: 'bg-red-500' },
  { value: '#ff9500', label: 'Orange', className: 'bg-orange-500' },
  { value: '#5856d6', label: 'Purple', className: 'bg-purple-500' },
  { value: '#af52de', label: 'Pink', className: 'bg-pink-500' },
  { value: '#ff2d92', label: 'Magenta', className: 'bg-pink-600' },
  { value: '#32d74b', label: 'Lime', className: 'bg-lime-500' },
  { value: '#64d2ff', label: 'Cyan', className: 'bg-cyan-500' },
  { value: '#ffd60a', label: 'Yellow', className: 'bg-yellow-500' },
];

const folderIcons = [
  { value: 'folder', label: 'Folder', icon: Folder },
  { value: 'folder-open', label: 'Folder Open', icon: FolderOpen },
  { value: 'file-text', label: 'Documents', icon: FileText },
  { value: 'shield', label: 'Security', icon: Shield },
  { value: 'dollar-sign', label: 'Finance', icon: DollarSign },
  { value: 'map', label: 'Plans', icon: Map },
  { value: 'users', label: 'People', icon: Users },
  { value: 'briefcase', label: 'Business', icon: Briefcase },
  { value: 'book', label: 'Education', icon: BookOpen },
  { value: 'settings', label: 'Settings', icon: Settings },
  { value: 'archive', label: 'Archive', icon: Archive },
  { value: 'package', label: 'Package', icon: Package },
];

export function EditFolderModal({ isOpen, onClose, onSuccess, folder }: EditFolderModalProps) {
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description || '');
  const [color, setColor] = useState(folder.color);
  const [icon, setIcon] = useState(folder.icon);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset form when folder changes
    setName(folder.name);
    setDescription(folder.description || '');
    setColor(folder.color);
    setIcon(folder.icon);
  }, [folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Folder name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateFolder(folder.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon,
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
          description: 'Folder updated successfully',
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update folder',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = folderIcons.find(f => f.value === icon)?.icon || Folder;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Folder</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the folder details below
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Folder Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter folder description (optional)"
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color" className="text-foreground">
                Folder Color
              </Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {folderColors.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: c.value }}
                        />
                        <span className="text-foreground">{c.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon" className="text-foreground">
                Folder Icon
              </Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger className="bg-input border-border text-foreground">
                  <div className="flex items-center gap-2">
                    <SelectedIcon className="w-4 h-4" style={{ color }} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {folderIcons.map((i) => {
                    const IconComponent = i.icon;
                    return (
                      <SelectItem key={i.value} value={i.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">{i.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
            <div 
              className="w-20 h-20 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color + '20' }}
            >
              <SelectedIcon className="w-10 h-10" style={{ color }} />
            </div>
            <div className="ml-4">
              <p className="font-medium text-foreground">{name || 'Folder Name'}</p>
              <p className="text-sm text-muted-foreground">{description || 'No description'}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? 'Updating...' : 'Update Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





