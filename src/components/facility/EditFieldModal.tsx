'use client';

import { useState, useEffect } from 'react';
import { Field, FieldType, SurfaceType, CreateFieldRequest } from '@/types/field';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { updateField } from '@/app/actions/fields';
import { AddressInput } from '@/components/ui/address-input';
import { 
  Settings, 
  MapPin, 
  DollarSign, 
  Grid3X3, 
  Users, 
  Lightbulb, 
  Car, 
  Accessibility, 
  Save,
  X,
  Upload,
  Camera,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface EditFieldModalProps {
  field: Field;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (field: Field) => void;
}

export function EditFieldModal({ field, isOpen, onClose, onUpdate }: EditFieldModalProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateFieldRequest>>({
    name: '',
    type: 'soccer',
    surface_type: 'natural_grass',
    dimensions: '',
    area_sq_ft: 0,
    capacity: 0,
    hourly_rate: 0,
    daily_rate: 0,
    street_address: '',
    zip_code: '',
    latitude: undefined,
    longitude: undefined,
    ada_compliant: false,
    has_lighting: false,
    has_scoreboard: false,
    has_restrooms: false,
    has_parking: false,
    parking_spots: 0,
    instant_booking: true,
    requires_approval: false,
    description: '',
    rules_and_policies: '',

  });

  // Image upload state
  const [fieldImages, setFieldImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const [virtualTourDescription, setVirtualTourDescription] = useState('');

  // Initialize form data when field changes
  useEffect(() => {
    if (field && isOpen) {
      setFormData({
        name: field.name || '',
        type: field.type || 'soccer',
        surface_type: field.surface_type || 'natural_grass',
        dimensions: field.dimensions || '',
        area_sq_ft: field.area_sq_ft || 0,
        capacity: field.capacity || 0,
        hourly_rate: field.hourly_rate || 0,
        daily_rate: field.daily_rate || 0,
        street_address: field.street_address || '',
        zip_code: field.zip_code || '',
        latitude: field.latitude,
        longitude: field.longitude,
        ada_compliant: field.ada_compliant || false,
        has_lighting: field.has_lighting || false,
        has_scoreboard: field.has_scoreboard || false,
        has_restrooms: field.has_restrooms || false,
        has_parking: field.has_parking || false,
        parking_spots: field.parking_spots || 0,
        instant_booking: field.instant_booking ?? true,
        requires_approval: field.requires_approval || false,
        description: field.description || '',
        rules_and_policies: field.rules_and_policies || ''
      });

      // Set existing images and virtual tour data
      const existingImageUrls = (field as any).image_urls || [];
      setExistingImages(existingImageUrls);
      setPrimaryImageIndex((field as any).primary_image_index || 0);
      setVirtualTourUrl((field as any).virtual_tour_url || '');
      setVirtualTourDescription((field as any).virtual_tour_description || '');
      setFieldImages([]); // Reset new file uploads
    }
  }, [field, isOpen]);

  const handleInputChange = (key: keyof CreateFieldRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddressChange = (address: { streetAddress: string; zipCode: string; city: string; state: string; latitude?: number; longitude?: number; full_address?: string }) => {
    setFormData(prev => ({
      ...prev,
      street_address: address.streetAddress,
      zip_code: address.zipCode,
      city: address.city,
      state: address.state,
      latitude: address.latitude,
      longitude: address.longitude,
      full_address: address.full_address,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Please upload only image files under 10MB.",
        variant: "destructive",
      });
    }

    setFieldImages(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setFieldImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setIsUpdating(true);
      
      if (!formData.name || !formData.type) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      // Remove undefined values and prepare data for update
      const updateData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          (acc as any)[key] = value;
        }
        return acc;
      }, {} as Partial<CreateFieldRequest>);

      // Add image and virtual tour data
      updateData.field_images = fieldImages;
      updateData.existing_image_urls = existingImages;
      updateData.virtual_tour_url = virtualTourUrl;
      updateData.virtual_tour_description = virtualTourDescription;

      const updatedField = await updateField(field.id, updateData);
      
      onUpdate(updatedField);
      onClose();
      
      toast({
        title: "Field updated",
        description: `${updatedField.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: "Failed to update field",
        description: "There was an error updating the field. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!field) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-background border-border text-foreground shadow-2xl">
        <DialogHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Edit Field: {field.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 px-1">
          {/* Basic Information */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-muted-foreground">Field Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Soccer Field A"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-muted-foreground">Field Type *</Label>
                  <Select value={formData.type} onValueChange={(value: FieldType) => handleInputChange('type', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="soccer">Soccer</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="baseball">Baseball</SelectItem>
                      <SelectItem value="softball">Softball</SelectItem>
                      <SelectItem value="track">Track</SelectItem>
                      <SelectItem value="pool">Pool</SelectItem>
                      <SelectItem value="gymnasium">Gymnasium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="surface_type" className="text-muted-foreground">Surface Type</Label>
                  <Select value={formData.surface_type} onValueChange={(value: SurfaceType) => handleInputChange('surface_type', value)}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Select surface type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="natural_grass">Natural Grass</SelectItem>
                      <SelectItem value="artificial_turf">Artificial Turf</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="asphalt">Asphalt</SelectItem>
                      <SelectItem value="synthetic">Synthetic</SelectItem>
                      <SelectItem value="clay">Clay</SelectItem>
                      <SelectItem value="sand">Sand</SelectItem>
                      <SelectItem value="rubber">Rubber</SelectItem>
                      <SelectItem value="wood">Wood</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dimensions" className="text-muted-foreground">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="e.g., 100m x 60m"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area_sq_ft" className="text-muted-foreground">Area (sq ft)</Label>
                  <Input
                    id="area_sq_ft"
                    type="number"
                    value={formData.area_sq_ft}
                    onChange={(e) => handleInputChange('area_sq_ft', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-muted-foreground">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parking_spots" className="text-muted-foreground">Parking Spots</Label>
                  <Input
                    id="parking_spots"
                    type="number"
                    value={formData.parking_spots}
                    onChange={(e) => handleInputChange('parking_spots', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate" className="text-muted-foreground">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="daily_rate" className="text-muted-foreground">Daily Rate ($)</Label>
                  <Input
                    id="daily_rate"
                    type="number"
                    step="0.01"
                    value={formData.daily_rate}
                    onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </h3>
              <AddressInput
                onAddressChange={handleAddressChange}
                streetAddress={formData.street_address || ''}
                zipCode={formData.zip_code || ''}
              />
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Field Images
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Upload photos of your field to showcase it to potential renters
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="field-images-edit"
                  />
                  <Label htmlFor="field-images-edit">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload additional field images
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPEG, PNG, WebP • Max 10MB per image
                      </p>
                    </div>
                  </Label>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground mb-3">Current Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={`Field image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Existing image {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Preview */}
                {fieldImages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-card-foreground mb-3">New Images to Add</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {fieldImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`New field image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="mt-1 text-xs text-muted-foreground truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Virtual Tour */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Virtual Tour (Optional)
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="virtual_tour_url_edit" className="text-muted-foreground">
                    Virtual Tour URL
                  </Label>
                  <Input
                    id="virtual_tour_url_edit"
                    value={virtualTourUrl}
                    onChange={(e) => setVirtualTourUrl(e.target.value)}
                    placeholder="https://my.matterport.com/show/?m=..."
                    className="bg-input border-border text-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported: Matterport, YouTube, Vimeo, or direct video links
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="virtual_tour_description_edit" className="text-muted-foreground">
                    Tour Description
                  </Label>
                  <Textarea
                    id="virtual_tour_description_edit"
                    value={virtualTourDescription}
                    onChange={(e) => setVirtualTourDescription(e.target.value)}
                    placeholder="Describe what users will see in the virtual tour..."
                    className="bg-input border-border text-foreground"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features & Amenities */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Features & Amenities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <Label htmlFor="has_lighting" className="text-muted-foreground">Lighting</Label>
                    </div>
                    <Switch
                      id="has_lighting"
                      checked={formData.has_lighting}
                      onCheckedChange={(checked) => handleInputChange('has_lighting', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-primary" />
                      <Label htmlFor="has_parking" className="text-muted-foreground">Parking</Label>
                    </div>
                    <Switch
                      id="has_parking"
                      checked={formData.has_parking}
                      onCheckedChange={(checked) => handleInputChange('has_parking', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Accessibility className="h-4 w-4 text-primary" />
                      <Label htmlFor="ada_compliant" className="text-muted-foreground">ADA Compliant</Label>
                    </div>
                    <Switch
                      id="ada_compliant"
                      checked={formData.ada_compliant}
                      onCheckedChange={(checked) => handleInputChange('ada_compliant', checked)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_scoreboard" className="text-muted-foreground">Scoreboard</Label>
                    <Switch
                      id="has_scoreboard"
                      checked={formData.has_scoreboard}
                      onCheckedChange={(checked) => handleInputChange('has_scoreboard', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="has_restrooms" className="text-muted-foreground">Restrooms</Label>
                    <Switch
                      id="has_restrooms"
                      checked={formData.has_restrooms}
                      onCheckedChange={(checked) => handleInputChange('has_restrooms', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="instant_booking" className="text-muted-foreground">Instant Booking</Label>
                    <Switch
                      id="instant_booking"
                      checked={formData.instant_booking}
                      onCheckedChange={(checked) => handleInputChange('instant_booking', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description & Policies */}
          <Card className="bg-card/60 border-border shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-card-foreground border-b border-border pb-3 mb-6 flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                Description & Policies
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-muted-foreground">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the field, its features, and what makes it special..."
                    rows={4}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rules_and_policies" className="text-muted-foreground">Rules and Policies</Label>
                  <Textarea
                    id="rules_and_policies"
                    value={formData.rules_and_policies}
                    onChange={(e) => handleInputChange('rules_and_policies', e.target.value)}
                    placeholder="Field rules, usage policies, restrictions, etc..."
                    rows={4}
                    className="bg-input border-border text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-1 py-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 min-w-[140px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Update Field'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 