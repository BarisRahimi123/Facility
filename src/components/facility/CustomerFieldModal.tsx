'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar,
  Star,
  Wifi,
  Car,
  Lightbulb,
  Accessibility,
  Trophy,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink
} from 'lucide-react';
import type { Field } from '@/types/field';

interface CustomerFieldModalProps {
  field: Field | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (field: Field) => void;
}

export function CustomerFieldModal({ field, isOpen, onClose, onReserve }: CustomerFieldModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVirtualTour, setShowVirtualTour] = useState(false);

  if (!field) return null;

  // Get all images (gallery + main image)
  
  // Ensure gallery_images is properly handled as an array
  let galleryImages = [];
  if (field.gallery_images) {
    if (Array.isArray(field.gallery_images)) {
      galleryImages = field.gallery_images;
    } else if (typeof field.gallery_images === 'string') {
      try {
        galleryImages = JSON.parse(field.gallery_images);
      } catch (e) {
        console.warn('Failed to parse gallery_images as JSON:', field.gallery_images);
        galleryImages = [];
      }
    }
  }
  
  // Combine gallery images with main image (avoid duplicates)
  const allImages = galleryImages.length > 0 
    ? galleryImages 
    : (field.image_url ? [field.image_url] : []);
  
  const hasImages = allImages.length > 0;
  

  const hasVirtualTour = field.virtual_tour_url;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const amenities = [
    { key: 'has_lighting', label: 'Lighting', icon: Lightbulb, available: field.has_lighting },
    { key: 'has_parking', label: 'Parking', icon: Car, available: field.has_parking },
    { key: 'has_scoreboard', label: 'Scoreboard', icon: Trophy, available: field.has_scoreboard },
    { key: 'ada_compliant', label: 'ADA Accessible', icon: Accessibility, available: field.ada_compliant },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                {field.name}
              </DialogTitle>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  {field.status}
                </Badge>
                <span className="text-muted-foreground capitalize">
                  {field.type?.replace('_', ' ')} Field
                </span>
                <div className="flex items-center text-yellow-400">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  <span className="text-sm font-medium">4.8</span>
                  <span className="text-muted-foreground text-sm ml-1">(24 reviews)</span>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{field.full_address || field.street_address || `${field.latitude}, ${field.longitude}`}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
          {/* Left Column - Images and Virtual Tour */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Gallery */}
            {hasImages && (
              <div className="relative">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${field.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/70 text-foreground p-2 rounded-full transition-colors backdrop-blur-sm"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/70 text-foreground p-2 rounded-full transition-colors backdrop-blur-sm"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 right-2 bg-background/70 text-foreground px-2 py-1 rounded text-sm backdrop-blur-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {allImages.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                          index === currentImageIndex 
                            ? 'border-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Virtual Tour */}
            {hasVirtualTour && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-primary" />
                      Virtual Tour
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(field.virtual_tour_url, '_blank')}
                      className="border-border text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open Full Screen
                    </Button>
                  </div>
                  
                  {showVirtualTour ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      <iframe
                        src={field.virtual_tour_url}
                        className="w-full h-full"
                        title={`${field.name} Virtual Tour`}
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center relative">
                      {hasImages && (
                        <img
                          src={allImages[0]}
                          alt={field.name}
                          className="w-full h-full object-cover opacity-50"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          onClick={() => setShowVirtualTour(true)}
                          className="bg-primary/90 hover:bg-primary text-primary-foreground px-6 py-3"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Start Virtual Tour
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {field.virtual_tour_description && (
                    <p className="text-muted-foreground text-sm mt-3">
                      {field.virtual_tour_description}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {field.description && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-foreground mb-3">About This Field</h3>
                  <p className="text-muted-foreground leading-relaxed">{field.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Field Details and Booking */}
          <div className="space-y-4">
            {/* Pricing Card */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-foreground mb-1">
                    ${field.hourly_rate}/hr
                  </div>
                  <div className="text-muted-foreground text-sm">
                    ${field.daily_rate}/day available
                  </div>
                </div>
                
                <Button
                  onClick={() => onReserve(field)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 mb-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Reserve Now
                </Button>
                
                <div className="text-center text-muted-foreground text-xs">
                  {field.instant_booking ? 'Instant booking available' : 'Approval required'}
                </div>
              </CardContent>
            </Card>

            {/* Field Details */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Field Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Capacity
                    </span>
                    <span className="text-foreground">{field.capacity} people</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Surface</span>
                    <span className="text-foreground capitalize">
                      {field.surface_type?.replace('_', ' ') || 'Standard'}
                    </span>
                  </div>
                  
                  {field.dimensions && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Dimensions</span>
                      <span className="text-foreground">{field.dimensions}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Maintenance</span>
                    <span className={`capitalize ${
                      field.maintenance_status === 'excellent' ? 'text-green-400' :
                      field.maintenance_status === 'good' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {field.maintenance_status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {amenities.map(({ key, label, icon: Icon, available }) => (
                    <div
                      key={key}
                      className={`flex items-center p-2 rounded-lg ${
                        available 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-muted/50 text-muted-foreground border border-border'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <span className="text-sm">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking Rules */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Booking Information</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-foreground">Operating Hours</div>
                      <div>6:00 AM - 10:00 PM daily</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <DollarSign className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-foreground">Cancellation</div>
                      <div>Free cancellation up to 24 hours before</div>
                    </div>
                  </div>
                  
                  {field.requires_approval && (
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-foreground">Approval Required</div>
                        <div>Bookings subject to approval within 24 hours</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}  