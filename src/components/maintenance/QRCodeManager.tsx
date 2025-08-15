'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { QrCode, Plus, Download, Trash2, Building, Home, Trees, MapPin, Copy, ExternalLink, Loader2 } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { generateQRCode, getQRCodes, deleteQRCode, type MaintenanceQRCode, type CreateQRCodeData } from '@/app/actions/maintenanceIssues';

interface QRCodeManagerProps {
  facilityId: string;
  facilityName?: string;
  buildings?: Array<{ id: string; name: string }>;
  rooms?: Array<{ id: string; name: string; building_id: string }>;
  fields?: Array<{ id: string; name: string }>;
}

export function QRCodeManager({
  facilityId,
  facilityName = 'Facility',
  buildings = [],
  rooms = [],
  fields = []
}: QRCodeManagerProps) {
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<MaintenanceQRCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedQRCode, setSelectedQRCode] = useState<MaintenanceQRCode | null>(null);
  const [qrImageUrls, setQrImageUrls] = useState<{ [key: string]: string }>({});

  // Form state
  const [locationType, setLocationType] = useState<'facility' | 'building' | 'room' | 'field'>('facility');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadQRCodes();
  }, [facilityId]);

  // Generate QR code images for display
  useEffect(() => {
    qrCodes.forEach(async (qr) => {
      if (!qrImageUrls[qr.id]) {
        try {
          const url = await QRCodeLib.toDataURL(qr.qr_url, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrImageUrls(prev => ({ ...prev, [qr.id]: url }));
        } catch (error) {
          console.error('Error generating QR code image:', error);
        }
      }
    });
  }, [qrCodes]);

  const loadQRCodes = async () => {
    setLoading(true);
    try {
      const result = await getQRCodes(facilityId);
      if (result.data) {
        setQrCodes(result.data);
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load QR codes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
    return facilityName;
  };

  const handleCreateQRCode = async () => {
    setCreating(true);

    try {
      const data: CreateQRCodeData = {
        facility_id: facilityId,
        building_id: locationType === 'building' || locationType === 'room' ? selectedBuilding : undefined,
        room_id: locationType === 'room' ? selectedRoom : undefined,
        field_id: locationType === 'field' ? selectedField : undefined,
        location_type: locationType,
        location_name: getLocationName(),
        location_details: locationDetails || undefined
      };

      const result = await generateQRCode(data);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'QR code created successfully',
        });
        setShowCreateModal(false);
        resetForm();
        loadQRCodes();
      }
    } catch (error) {
      console.error('Error creating QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to create QR code',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteQRCode = async () => {
    if (!selectedQRCode) return;

    try {
      const result = await deleteQRCode(selectedQRCode.id);

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Success',
          description: 'QR code deleted successfully',
        });
        setShowDeleteDialog(false);
        setSelectedQRCode(null);
        loadQRCodes();
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete QR code',
        variant: 'destructive'
      });
    }
  };

  const downloadQRCode = async (qrCode: MaintenanceQRCode) => {
    try {
      const canvas = document.createElement('canvas');
      await QRCodeLib.toCanvas(canvas, qrCode.qr_url, {
        width: 400,
        margin: 2
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${qrCode.code}.png`;
      a.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: 'Error',
        description: 'Failed to download QR code',
        variant: 'destructive'
      });
    }
  };

  const copyQRUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'QR code URL copied to clipboard',
    });
  };

  const resetForm = () => {
    setLocationType('facility');
    setSelectedBuilding('');
    setSelectedRoom('');
    setSelectedField('');
    setLocationDetails('');
  };

  const filteredRooms = selectedBuilding 
    ? rooms.filter(r => r.building_id === selectedBuilding)
    : [];

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'building': return <Building className="w-4 h-4" />;
      case 'room': return <Home className="w-4 h-4" />;
      case 'field': return <Trees className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            QR Code Management
          </CardTitle>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate QR Code
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-8">
              <QrCode className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No QR codes generated yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Generate QR codes for different locations to enable quick issue reporting
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrCodes.map(qrCode => (
                <Card key={qrCode.id} className="bg-muted/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(qrCode.location_type)}
                        <div>
                          <p className="font-medium text-foreground">{qrCode.location_name}</p>
                          <p className="text-xs text-muted-foreground">{qrCode.code}</p>
                        </div>
                      </div>
                    </div>
                    
                    {qrImageUrls[qrCode.id] && (
                      <div className="bg-white p-2 rounded mb-3">
                        <img
                          src={qrImageUrls[qrCode.id]}
                          alt={`QR Code for ${qrCode.location_name}`}
                          className="w-full h-auto"
                        />
                      </div>
                    )}

                    {qrCode.location_details && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {qrCode.location_details}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQRCode(qrCode)}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyQRUrl(qrCode.qr_url)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(qrCode.qr_url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQRCode(qrCode);
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create QR Code Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Generate QR Code</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a QR code for a specific location to enable quick issue reporting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Location Type</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={locationType === 'facility' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setLocationType('facility');
                    setSelectedBuilding('');
                    setSelectedRoom('');
                    setSelectedField('');
                  }}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Facility
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'building' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setLocationType('building');
                    setSelectedRoom('');
                    setSelectedField('');
                  }}
                >
                  <Building className="w-4 h-4 mr-1" />
                  Building
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'room' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setLocationType('room');
                    setSelectedField('');
                  }}
                >
                  <Home className="w-4 h-4 mr-1" />
                  Room
                </Button>
                <Button
                  type="button"
                  variant={locationType === 'field' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setLocationType('field');
                    setSelectedBuilding('');
                    setSelectedRoom('');
                  }}
                >
                  <Trees className="w-4 h-4 mr-1" />
                  Field
                </Button>
              </div>
            </div>

            {(locationType === 'building' || locationType === 'room') && (
              <div className="space-y-2">
                <Label className="text-foreground">Building</Label>
                <Select
                  value={selectedBuilding}
                  onValueChange={setSelectedBuilding}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {buildings.map(building => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {locationType === 'room' && selectedBuilding && (
              <div className="space-y-2">
                <Label className="text-foreground">Room</Label>
                <Select
                  value={selectedRoom}
                  onValueChange={setSelectedRoom}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {filteredRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {locationType === 'field' && (
              <div className="space-y-2">
                <Label className="text-foreground">Field</Label>
                <Select
                  value={selectedField}
                  onValueChange={setSelectedField}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {fields.map(field => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="details" className="text-foreground">Location Details (Optional)</Label>
              <Textarea
                id="details"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder="e.g., Near the main entrance, Second floor hallway..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              disabled={creating}
              className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateQRCode}
              disabled={creating || 
                (locationType === 'building' && !selectedBuilding) ||
                (locationType === 'room' && (!selectedBuilding || !selectedRoom)) ||
                (locationType === 'field' && !selectedField)
              }
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete QR Code?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete the QR code for "{selectedQRCode?.location_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQRCode}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}





