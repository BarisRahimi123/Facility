'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Building, MapPin, Home, Trees, Upload, Camera, QrCode, Loader2 } from 'lucide-react';
import { createIssueReport, getQRCodeByCode, type CreateIssueReportData } from '@/app/actions/maintenanceIssues';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  facilityId?: string;
  facilityName?: string;
  qrCode?: string; // QR code if scanned
  facilities?: Array<{ id: string; name: string }>;
  buildings?: Array<{ id: string; name: string; facility_id: string }>;
  rooms?: Array<{ id: string; name: string; building_id: string }>;
  fields?: Array<{ id: string; name: string; facility_id: string }>;
}

const issueCategories = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'structural', label: 'Structural' },
  { value: 'safety', label: 'Safety' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' }
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
];

export function IssueReportModal({
  isOpen,
  onClose,
  onSuccess,
  facilityId,
  facilityName = 'Facility',
  qrCode,
  facilities = [],
  buildings = [],
  rooms = [],
  fields = []
}: IssueReportModalProps) {
  const { toast } = useToast();
  
  // Initialize loading states first to avoid temporal dead zone
  const [loading, setLoading] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, loading, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setSelectedFacility('');
      setSelectedBuilding('');
      setSelectedRoom('');
      setSelectedField('');
      setLocationType('facility');
      setReporterName('');
      setReporterEmail('');
      setReporterPhone('');
      setImages([]);
      setLoading(false);
    }
  }, [isOpen]);
  
  // Debug logging
  useEffect(() => {
    console.log('IssueReportModal - Buildings data:', buildings);
    console.log('IssueReportModal - Rooms data:', rooms);
    console.log('IssueReportModal - Fields data:', fields);
    console.log('IssueReportModal - Facilities data:', facilities);
    console.log('IssueReportModal - Facility ID:', facilityId);
  }, [buildings, rooms, fields, facilities, facilityId]);
  
  // Temporary test data to verify dropdown works
  const testBuildings = [
    { id: 'test1', name: 'Test Building 1', facility_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    { id: 'test2', name: 'Test Building 2', facility_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
    { id: 'test3', name: 'Test Building 3', facility_id: '550e8400-e29b-41d4-a716-446655440000' }
  ];
  
  // Use test data if buildings is empty for debugging
  const effectiveBuildings = buildings && buildings.length > 0 ? buildings : testBuildings;
  
  // Form state
  const [locationType, setLocationType] = useState<'facility' | 'building' | 'room' | 'field'>('facility');
  const [selectedFacility, setSelectedFacility] = useState(facilityId || '');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CreateIssueReportData['category']>('other');
  const [priority, setPriority] = useState<CreateIssueReportData['priority']>('medium');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [qrCodeData, setQrCodeData] = useState<any>(null);

  // Cascading dropdown filtering
  const filteredBuildings = effectiveBuildings.filter(building => 
    building.facility_id === selectedFacility
  );
  
  const filteredRooms = rooms.filter(room => 
    room.building_id === selectedBuilding
  );
  
  const filteredFields = fields.filter(field => 
    field.facility_id === selectedFacility
  );

  // Reset dependent selections when parent changes
  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacility(facilityId);
    setSelectedBuilding(''); // Reset building
    setSelectedRoom(''); // Reset room
    setSelectedField(''); // Reset field
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedRoom(''); // Reset room when building changes
  };

  // Load QR code data if provided
  useEffect(() => {
    if (qrCode && isOpen) {
      loadQRCodeData();
    }
  }, [qrCode, isOpen]);

  const loadQRCodeData = async () => {
    if (!qrCode) return;
    
    setLoadingQR(true);
    try {
      const result = await getQRCodeByCode(qrCode);
      if (result.data) {
        setQrCodeData(result.data);
        
        // Pre-fill location based on QR code
        setLocationType(result.data.location_type);
        if (result.data.building_id) {
          setSelectedBuilding(result.data.building_id);
          setLocationType('building');
        }
        if (result.data.room_id) {
          setSelectedRoom(result.data.room_id);
          setLocationType('room');
          // Find and set the building for this room
          const room = rooms.find(r => r.id === result.data.room_id);
          if (room) setSelectedBuilding(room.building_id);
        }
        if (result.data.field_id) {
          setSelectedField(result.data.field_id);
          setLocationType('field');
        }
      }
    } catch (error) {
      console.error('Error loading QR code data:', error);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getLocationName = () => {
    if (locationType === 'room' && selectedRoom) {
      const room = rooms.find(r => r.id === selectedRoom);
      const building = buildings.find(b => b.id === selectedBuilding);
      return `${room?.name || 'Room'} - ${building?.name || 'Building'}`;
    }
    if (locationType === 'building' && selectedBuilding) {
      const building = buildings.find(b => b.id === selectedBuilding);
      return building?.name || 'Building';
    }
    if (locationType === 'field' && selectedField) {
      const field = fields.find(f => f.id === selectedField);
      return field?.name || 'Field';
    }
    if (locationType === 'facility' && selectedFacility) {
      const facility = facilities.find(f => f.id === selectedFacility);
      return facility?.name || 'Facility';
    }
    return facilityName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Upload images to storage first and get URLs
      const imageUrls: string[] = [];
      
      const issueData: CreateIssueReportData = {
        facility_id: selectedFacility || facilityId,
        building_id: locationType === 'building' || locationType === 'room' ? selectedBuilding : undefined,
        room_id: locationType === 'room' ? selectedRoom : undefined,
        field_id: locationType === 'field' ? selectedField : undefined,
        qr_code_id: qrCodeData?.id,
        title,
        description,
        category,
        priority,
        reporter_name: reporterName,
        reporter_email: reporterEmail,
        reporter_phone: reporterPhone,
        location_type: locationType,
        location_name: getLocationName(),
        location_details: qrCodeData?.location_details,
        images: imageUrls
      };

      const result = await createIssueReport(issueData);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Issue reported successfully. Our team will review it shortly.',
        });
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit issue report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // filteredRooms is defined above in cascading logic

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-border"
        onPointerDownOutside={(e) => {
          if (!loading) {
            onClose();
          } else {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Report Maintenance Issue
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {qrCode ? (
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Reporting via QR Code: {qrCodeData?.location_name || qrCode}
              </span>
            ) : (
              'Help us identify and resolve maintenance issues quickly'
            )}
          </DialogDescription>
        </DialogHeader>

        {loadingQR ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Selection */}
            <div className="space-y-4">
              <Label className="text-foreground font-semibold">Location</Label>
              
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={locationType === 'facility' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocationType('facility')}
                  disabled={!!qrCode}
                  className={locationType === 'facility' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Facility
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'building' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocationType('building')}
                  disabled={!!qrCode}
                  className={locationType === 'building' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Building className="w-4 h-4 mr-1" />
                  Building
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'room' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocationType('room')}
                  disabled={!!qrCode}
                  className={locationType === 'room' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Home className="w-4 h-4 mr-1" />
                  Room
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'field' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLocationType('field')}
                  disabled={!!qrCode}
                  className={locationType === 'field' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Trees className="w-4 h-4 mr-1" />
                  Field
                </Button>
              </div>

              {/* Facility Selection - Always show for all location types */}
              <div className="space-y-2">
                  <Label className="text-foreground">Select Facility</Label>
                  <Select
                    value={selectedFacility}
                    onValueChange={handleFacilityChange}
                    disabled={!!qrCode}
                    required
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {facilities && facilities.length > 0 ? (
                        facilities.map(facility => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-facilities" disabled>
                          No facilities available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

              {/* Building Selection */}
              {(locationType === 'building' || locationType === 'room') && selectedFacility && (
                <div className="space-y-2">
                  <Label className="text-foreground">Select Building</Label>
                  <Select
                    value={selectedBuilding}
                    onValueChange={handleBuildingChange}
                    disabled={!!qrCode}
                    required
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder={
                        filteredBuildings.length === 0 
                          ? "No buildings available for this facility" 
                          : "Select building"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {filteredBuildings && filteredBuildings.length > 0 ? (
                        filteredBuildings.map(building => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-buildings" disabled>
                          No buildings available for this facility
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Room Selection */}
              {locationType === 'room' && selectedBuilding && (
                <div className="space-y-2">
                  <Label className="text-foreground">Select Room</Label>
                  <Select
                    value={selectedRoom}
                    onValueChange={setSelectedRoom}
                    disabled={!!qrCode}
                    required
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder={
                        filteredRooms.length === 0 
                          ? "No rooms available for this building" 
                          : "Select room"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {filteredRooms && filteredRooms.length > 0 ? (
                        filteredRooms.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-rooms" disabled>
                          No rooms available for this building
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Field Selection */}
              {locationType === 'field' && selectedFacility && (
                <div className="space-y-2">
                  <Label className="text-foreground">Select Field</Label>
                  <Select
                    value={selectedField}
                    onValueChange={setSelectedField}
                    disabled={!!qrCode}
                    required
                  >
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue placeholder={
                        filteredFields.length === 0 
                          ? "No fields available for this facility" 
                          : "Select field"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {filteredFields && filteredFields.length > 0 ? (
                        filteredFields.map(field => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-fields" disabled>
                          No fields available for this facility
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Issue Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Category *</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)} required>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {issueCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-foreground">Priority *</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)} required>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {priorityLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Issue Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Detailed Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide as much detail as possible about the issue..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground min-h-[100px]"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-foreground">Photos (Optional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={images.length >= 5}
                  className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photos ({images.length}/5)
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reporter Information */}
            <div className="space-y-4 border-t border-border pt-4">
              <Label className="text-foreground font-semibold">Your Contact Information *</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground text-sm">Name *</Label>
                  <Input
                    id="name"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Your name"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground text-sm">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                disabled={loading}
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !title || !description}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Issue Report
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
