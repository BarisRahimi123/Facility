'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadAerialImage } from '@/app/actions/aerialImages';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Plus } from 'lucide-react';

interface UploadAerialImageModalProps {
  facilityId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const imageTypes = [
  { value: 'drone_photo', label: 'Drone Photo' },
  { value: 'mosaic', label: 'Auto-Mosaic' },
  { value: 'map', label: 'Map/Survey' },
  { value: 'thermal', label: 'Thermal Image' },
  { value: 'other', label: 'Other' },
];

export default function UploadAerialImageModal({ 
  facilityId, 
  isOpen, 
  onClose, 
  onSuccess 
}: UploadAerialImageModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageType, setImageType] = useState('drone_photo');
  const [captureDate, setCaptureDate] = useState('');
  const [resolution, setResolution] = useState('');
  const [coverageArea, setCoverageArea] = useState('');
  const [altitude, setAltitude] = useState('');
  const [cameraSpecs, setCameraSpecs] = useState('');
  const [processingSoftware, setProcessingSoftware] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageType('drone_photo');
    setCaptureDate('');
    setResolution('');
    setCoverageArea('');
    setAltitude('');
    setCameraSpecs('');
    setProcessingSoftware('');
    setSelectedFile(null);
    
    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Get file extension
      const fileExtension = file.name.toLowerCase().split('.').pop();
      
      // Validate file type by extension and MIME type
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'tif', 'tiff'];
      const allowedTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/tiff', 
        'image/tif',
        'image/x-tiff',
        'application/octet-stream' // TIFF files sometimes show as this
      ];
      
      const isValidExtension = allowedExtensions.includes(fileExtension || '');
      const isValidMimeType = allowedTypes.includes(file.type);
      
      // Accept if either extension is valid OR MIME type is valid
      if (!isValidExtension && !isValidMimeType) {
        console.error('Invalid file type:', {
          extension: fileExtension,
          mimeType: file.type,
          allowedExtensions,
          allowedTypes
        });
        toast({
          title: 'Invalid file type',
          description: `Please select a JPEG, PNG, or TIFF image file. Detected: ${file.type || 'unknown'} (.${fileExtension})`,
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 50MB.',
          variant: 'destructive',
        });
        return;
      }

      console.log('File validation passed:', file.name);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !title.trim() || !captureDate) {
      toast({
        title: 'Missing information',
        description: 'Please provide a title, capture date, and select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('facilityId', facilityId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('imageType', imageType);
      formData.append('captureDate', captureDate);
      formData.append('resolution', resolution);
      formData.append('coverageArea', coverageArea);
      formData.append('altitude', altitude);
      formData.append('cameraSpecs', cameraSpecs);
      formData.append('processingSoftware', processingSoftware);
      formData.append('file', selectedFile);

      console.log('Uploading aerial image with form data...');
      await uploadAerialImage(formData);

      toast({
        title: 'Image uploaded successfully',
        description: `${title} has been added to your aerial images.`,
        variant: 'default',
      });

      resetForm();
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      console.error('Error uploading aerial image:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload the aerial image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800 max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Upload Aerial Image</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add drone photos, mosaics, or aerial maps to your facility documentation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="file" className="text-gray-300 mb-2 block">
                Image File *
              </Label>
              <Input
                id="file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/tiff,image/tif,.jpg,.jpeg,.png,.tif,.tiff"
                onChange={handleFileSelect}
                className="bg-gray-800 border-gray-700 text-white file:bg-gray-700 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPEG, PNG, TIFF. Max size: 50MB
              </p>
              {selectedFile && (
                <p className="text-xs text-green-400 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-gray-300 mb-2 block">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Main Campus Drone Survey"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="imageType" className="text-gray-300 mb-2 block">
                  Image Type *
                </Label>
                <Select value={imageType} onValueChange={setImageType} required>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select image type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {imageTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-gray-300 focus:bg-gray-700 focus:text-white">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300 mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the aerial image..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="captureDate" className="text-gray-300 mb-2 block">
                  Capture Date *
                </Label>
                <Input
                  id="captureDate"
                  type="date"
                  value={captureDate}
                  onChange={(e) => setCaptureDate(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="altitude" className="text-gray-300 mb-2 block">
                  Altitude (ft)
                </Label>
                <Input
                  id="altitude"
                  type="number"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  placeholder="e.g., 400"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resolution" className="text-gray-300 mb-2 block">
                  Resolution
                </Label>
                <Input
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="e.g., 4000x3000, 4K"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="coverageArea" className="text-gray-300 mb-2 block">
                  Coverage Area
                </Label>
                <Input
                  id="coverageArea"
                  value={coverageArea}
                  onChange={(e) => setCoverageArea(e.target.value)}
                  placeholder="e.g., 50 acres, 2 sq miles"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cameraSpecs" className="text-gray-300 mb-2 block">
                  Camera/Equipment
                </Label>
                <Input
                  id="cameraSpecs"
                  value={cameraSpecs}
                  onChange={(e) => setCameraSpecs(e.target.value)}
                  placeholder="e.g., DJI Mavic 3, Canon EOS R5"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div>
                <Label htmlFor="processingSoftware" className="text-gray-300 mb-2 block">
                  Processing Software
                </Label>
                <Input
                  id="processingSoftware"
                  value={processingSoftware}
                  onChange={(e) => setProcessingSoftware(e.target.value)}
                  placeholder="e.g., Pix4D, DroneDeploy"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedFile || !title.trim() || !captureDate}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 