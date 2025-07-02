'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Camera, Trash2, Edit2, Download, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { FacilityPhoto, getFacilityPhotos, uploadFacilityPhoto, deleteFacilityPhoto, updateFacilityPhotoDescription } from '@/app/actions/facilityPhotos';

interface FacilityPhotosProps {
  facilityId: string;
}

export function FacilityPhotos({ facilityId }: FacilityPhotosProps) {
  const [photos, setPhotos] = useState<FacilityPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<FacilityPhoto | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadPhotos();
  }, [facilityId]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const facilityPhotos = await getFacilityPhotos(facilityId);
      setPhotos(facilityPhotos);
    } catch (error) {
      console.error('Error loading facility photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('facilityId', facilityId);
      formData.append('description', '');

      const newPhoto = await uploadFacilityPhoto(formData);
      setPhotos(prev => [newPhoto, ...prev]);
      
      toast.success('Photo uploaded successfully');
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: FacilityPhoto) => {
    if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFacilityPhoto(photo.id);
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  };

  const handleEditDescription = (photo: FacilityPhoto) => {
    setSelectedPhoto(photo);
    setEditDescription(photo.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveDescription = async () => {
    if (!selectedPhoto) return;

    try {
      await updateFacilityPhotoDescription(selectedPhoto.id, editDescription);
      setPhotos(prev => 
        prev.map(p => 
          p.id === selectedPhoto.id 
            ? { ...p, description: editDescription }
            : p
        )
      );
      toast.success('Description updated successfully');
      setIsEditModalOpen(false);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
    }
  };

  const handleViewPhoto = (photo: FacilityPhoto) => {
    setSelectedPhoto(photo);
    setIsViewModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-card-foreground">Facility Photos</h3>
              <p className="text-sm text-muted-foreground">Upload and manage photos of this facility</p>
            </div>
            <div>
              <Label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span>Upload Photo</span>
                </div>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading photos...</p>
          </div>
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <Card key={photo.id} className="group bg-card border-border overflow-hidden hover:shadow-lg transition-all duration-200">
              <div className="relative aspect-video">
                <Image
                  src={photo.url}
                  alt={photo.description || 'Facility photo'}
                  fill
                  className="object-cover"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={() => handleViewPhoto(photo)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                        onClick={() => handleEditDescription(photo)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-red-50"
                        onClick={() => handleDeletePhoto(photo)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {photo.file_type.split('/')[1]?.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(photo.file_size)}
                    </span>
                  </div>
                  
                  {photo.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-card-foreground">No photos yet</h3>
            <p className="mt-2 text-muted-foreground">Upload photos to showcase your facility.</p>
            <div className="mt-6">
              <Label htmlFor="photo-upload-empty" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground px-4 py-2 rounded-lg transition-colors shadow-sm">
                  <Plus className="h-4 w-4" />
                  <span>Upload First Photo</span>
                </div>
                <Input
                  id="photo-upload-empty"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Photo Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Facility Photo
            </DialogTitle>
            <DialogDescription>
              {selectedPhoto?.description || 'Facility photo'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.description || 'Facility photo'}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-foreground">File name:</span>
                  <p className="text-muted-foreground">{selectedPhoto.file_name}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">File size:</span>
                  <p className="text-muted-foreground">{formatFileSize(selectedPhoto.file_size)}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">File type:</span>
                  <p className="text-muted-foreground">{selectedPhoto.file_type}</p>
                </div>
                <div>
                  <span className="font-medium text-foreground">Uploaded:</span>
                  <p className="text-muted-foreground">{new Date(selectedPhoto.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedPhoto.description && (
                <div>
                  <span className="font-medium text-foreground">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedPhoto.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Description Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo Description</DialogTitle>
            <DialogDescription>
              Add or update the description for this photo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter a description for this photo..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveDescription}>
                Save Description
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 