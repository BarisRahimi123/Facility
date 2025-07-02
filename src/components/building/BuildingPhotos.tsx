import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Plus, X, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/ui/use-toast';
import { getBuildingPhotos, uploadBuildingPhoto, deleteBuildingPhoto } from '@/app/actions/buildingPhotos';

interface BuildingPhoto {
  id: string;
  url: string;
  description?: string;
  created_at: string;
}

interface BuildingPhotosProps {
  buildingId: string;
}

export function BuildingPhotos({ buildingId }: BuildingPhotosProps) {
  const [photos, setPhotos] = useState<BuildingPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<BuildingPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadPhotos() {
      try {
        const photos = await getBuildingPhotos(buildingId);
        setPhotos(photos);
      } catch (error) {
        console.error('Error loading photos:', error);
        // If table doesn't exist, show a helpful message
        if (error instanceof Error && error.message.includes('relation "public.building_photos" does not exist')) {
          toast({
            title: "Photos feature not set up",
            description: "The photos database table needs to be created. Please run the migration script.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to load photos",
            description: "There was an error loading the building photos. Please try again.",
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadPhotos();
  }, [buildingId, toast]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('buildingId', buildingId);

      const newPhoto = await uploadBuildingPhoto(formData);
      setPhotos(prev => [...prev, newPhoto]);
      
      toast({
        title: "Photo uploaded",
        description: "Your photo has been uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      // If table doesn't exist, show a helpful message
      if (error instanceof Error && error.message.includes('relation "public.building_photos" does not exist')) {
        toast({
          title: "Photos feature not set up",
          description: "The photos database table needs to be created. Please run the migration script.",
          variant: "destructive",
        });
      } else if (error instanceof Error && error.message.includes('bucket') && error.message.includes('not found')) {
        toast({
          title: "Storage not configured",
          description: "The photos storage bucket needs to be created in Supabase.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "There was an error uploading your photo. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Building Photos</h3>
            <p className="text-sm text-gray-400">Upload and manage photos of this building</p>
          </div>
          <div>
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
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
      </Card>

      {/* Photos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <Card className="col-span-full p-8 bg-gray-900/50 border-gray-800">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <h3 className="font-medium text-gray-200">Loading photos...</h3>
                <p className="text-sm text-gray-400">Please wait while we fetch the building photos</p>
              </div>
            </div>
          </Card>
        ) : photos.length === 0 ? (
          <Card className="col-span-full p-8 bg-gray-900/50 border-gray-800">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <Camera className="h-12 w-12 text-gray-500" />
              <div className="space-y-1">
                <h3 className="font-medium text-gray-200">No photos yet</h3>
                <p className="text-sm text-gray-400">Upload photos to start building your collection</p>
              </div>
            </div>
          </Card>
        ) : (
          photos.map(photo => (
            <Dialog key={photo.id}>
              <DialogTrigger asChild>
                <Card 
                  className="group relative cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-black"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={photo.url}
                      alt={photo.description || 'Building photo'}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-sm text-white truncate">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-4xl bg-gray-900/95 border-gray-800">
                <div className="relative aspect-video">
                  <Image
                    src={photo.url}
                    alt={photo.description || 'Building photo'}
                    fill
                    className="object-contain"
                  />
                </div>
                {photo.description && (
                  <p className="text-sm text-gray-300 mt-2">{photo.description}</p>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={async () => {
                      if (!selectedPhoto) return;
                      
                      const isConfirmed = window.confirm(
                        'Are you sure you want to delete this photo? This action cannot be undone.'
                      );
                      
                      if (!isConfirmed) return;
                      
                      try {
                        await deleteBuildingPhoto(selectedPhoto.id);
                        setPhotos(prev => prev.filter(p => p.id !== selectedPhoto.id));
                        setSelectedPhoto(null);
                        toast({
                          title: "Photo deleted",
                          description: "The photo has been deleted successfully.",
                        });
                      } catch (error) {
                        console.error('Error deleting photo:', error);
                        toast({
                          title: "Failed to delete photo",
                          description: "There was an error deleting the photo. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))
        )}
      </div>
    </div>
  );
} 