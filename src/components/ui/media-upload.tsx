'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Play, 
  Map, 
  Camera,
  FileImage,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';

interface MediaUploadProps {
  fieldImages: File[];
  virtualTourUrl: string;
  virtualTourDescription: string;
  aerialImage: File | null;
  aerialImageDescription: string;
  onFieldImagesChange: (files: File[]) => void;
  onVirtualTourChange: (url: string, description: string) => void;
  onAerialImageChange: (file: File | null, description: string) => void;
}

export function MediaUpload({
  fieldImages,
  virtualTourUrl,
  virtualTourDescription,
  aerialImage,
  aerialImageDescription,
  onFieldImagesChange,
  onVirtualTourChange,
  onAerialImageChange
}: MediaUploadProps) {
  const fieldImageInputRef = useRef<HTMLInputElement>(null);
  const aerialImageInputRef = useRef<HTMLInputElement>(null);

  const handleFieldImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Please upload only image files under 10MB.');
    }

    onFieldImagesChange([...fieldImages, ...validFiles]);
  };

  const removeFieldImage = (index: number) => {
    const newImages = fieldImages.filter((_, i) => i !== index);
    onFieldImagesChange(newImages);
  };

  const handleAerialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a valid image file (including TIFF)
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/tif', 'image/webp'];
    const isValidType = validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');
    const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit for aerial images

    if (!isValidType) {
      alert('Please upload a valid image file (JPEG, PNG, TIFF, WebP)');
      return;
    }

    if (!isValidSize) {
      alert('Aerial image must be under 50MB');
      return;
    }

    onAerialImageChange(file, aerialImageDescription);
  };

  const removeAerialImage = () => {
    onAerialImageChange(null, '');
    if (aerialImageInputRef.current) {
      aerialImageInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Field Images */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Camera className="w-5 h-5 mr-2 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Field Images</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Upload multiple photos of your field to help users see what they're booking
          </p>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fieldImageInputRef.current?.click()}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Field Images
            </Button>

            <input
              ref={fieldImageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFieldImageUpload}
              className="hidden"
            />

            {/* Image Preview Grid */}
            {fieldImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {fieldImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={`Field image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFieldImage(index)}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-1 text-xs text-gray-400 truncate">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-500">
              Supported formats: JPEG, PNG, WebP • Max 10MB per image • Upload multiple images
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Virtual Tour */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Play className="w-5 h-5 mr-2 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Virtual Tour</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Add a 360° virtual tour or video walkthrough of your field
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="virtual_tour_url" className="text-gray-300">
                Virtual Tour URL
              </Label>
              <Input
                id="virtual_tour_url"
                value={virtualTourUrl}
                onChange={(e) => onVirtualTourChange(e.target.value, virtualTourDescription)}
                placeholder="https://my.matterport.com/show/?m=..."
                className="bg-gray-800 border-gray-700 text-white"
              />
              <div className="text-xs text-gray-500">
                Supported: Matterport, YouTube, Vimeo, or direct video links
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="virtual_tour_description" className="text-gray-300">
                Tour Description
              </Label>
              <Textarea
                id="virtual_tour_description"
                value={virtualTourDescription}
                onChange={(e) => onVirtualTourChange(virtualTourUrl, e.target.value)}
                placeholder="Describe what users will see in the virtual tour..."
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aerial Image */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Map className="w-5 h-5 mr-2 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Aerial Image Overlay</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Upload an aerial/satellite image or mosaic to overlay on the map for better field visualization
          </p>

          <div className="space-y-4">
            {!aerialImage ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => aerialImageInputRef.current?.click()}
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <FileImage className="w-4 h-4 mr-2" />
                Upload Aerial Image
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <FileImage className="w-8 h-8 mr-3 text-purple-400" />
                    <div>
                      <div className="text-white font-medium">{aerialImage.name}</div>
                      <div className="text-gray-400 text-sm">
                        {(aerialImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeAerialImage}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aerial_description" className="text-gray-300">
                    Aerial Image Description
                  </Label>
                  <Textarea
                    id="aerial_description"
                    value={aerialImageDescription}
                    onChange={(e) => onAerialImageChange(aerialImage, e.target.value)}
                    placeholder="Describe the aerial view, date taken, coverage area..."
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <input
              ref={aerialImageInputRef}
              type="file"
              accept="image/*,.tif,.tiff"
              onChange={handleAerialImageUpload}
              className="hidden"
            />

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <div className="font-medium mb-1">Aerial Image Guidelines:</div>
                  <ul className="space-y-1 text-blue-200">
                    <li>• Supports TIFF, JPEG, PNG formats up to 50MB</li>
                    <li>• High-resolution images work best for map overlays</li>
                    <li>• Image will be automatically positioned based on field coordinates</li>
                    <li>• Mosaic TIFF files from drone mapping are recommended</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Supported formats: TIFF, JPEG, PNG • Max 50MB • Georeferenced images preferred
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 