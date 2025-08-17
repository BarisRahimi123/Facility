'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Share2, Mail, Copy, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

// Mock data for facilities, buildings, and rooms
const mockFacilities = [
  { id: '1', name: 'Main Campus' },
  { id: '2', name: 'South Building' },
  { id: '3', name: 'Research Center' },
];

const mockBuildings = {
  '1': [
    { id: 'b1', name: 'Building A' },
    { id: 'b2', name: 'Building B' },
    { id: 'b3', name: 'Building C' },
  ],
  '2': [
    { id: 'b4', name: 'Building D' },
    { id: 'b5', name: 'Building E' },
  ],
  '3': [
    { id: 'b6', name: 'Lab Building' },
    { id: 'b7', name: 'Research Wing' },
  ],
};

const mockRooms = {
  'b1': [{ id: 'r1', number: '101' }, { id: 'r2', number: '102' }],
  'b2': [{ id: 'r3', number: '201' }, { id: 'r4', number: '202' }],
  'b3': [{ id: 'r5', number: '301' }, { id: 'r6', number: '302' }],
  'b4': [{ id: 'r7', number: '401' }, { id: 'r8', number: '402' }],
  'b5': [{ id: 'r9', number: '501' }, { id: 'r10', number: '502' }],
  'b6': [{ id: 'r11', number: '601' }, { id: 'r12', number: '602' }],
  'b7': [{ id: 'r13', number: '701' }, { id: 'r14', number: '702' }],
};

export interface IssueFormData {
  facilityId: string;
  buildingId?: string;
  roomId?: string;
  location: string;
  systemType: string;
  issueType: string;
  description: string;
  photos: File[];
  impact: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high';
  urgencyScore?: number;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
}

interface IssueReportFormProps {
  onSubmit: (data: IssueFormData) => void;
  defaultValues?: {
    location?: string;
    systemType?: string;
    issueType?: string;
    description?: string;
  };
}

const systemTypes = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Structural',
  'Security',
];

const issueTypesBySystem: Record<string, string[]> = {
  'HVAC': ['No cooling', 'No heating', 'Strange noise', 'Poor air flow'],
  'Electrical': ['No power', 'Flickering lights', 'Tripped breaker', 'Faulty outlet'],
  'Plumbing': ['Leak', 'No water', 'Clogged drain', 'Low pressure'],
  'Structural': ['Crack in wall', 'Door issue', 'Window issue', 'Ceiling damage'],
  'Security': ['Camera malfunction', 'Door lock issue', 'Alarm system', 'Access control'],
};

export default function IssueReportForm({ onSubmit, defaultValues = {} }: IssueReportFormProps) {
  const [formData, setFormData] = useState<IssueFormData>({
    facilityId: defaultValues.location?.split(',')[0] || '',
    buildingId: '',
    roomId: '',
    location: defaultValues.location || '',
    systemType: defaultValues.systemType || '',
    issueType: defaultValues.issueType || '',
    description: defaultValues.description || '',
    photos: [],
    impact: 'low',
    severity: 'low',
    submitterName: '',
    submitterEmail: '',
    submitterPhone: '',
  });

  const [error, setError] = useState<string>('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Add share dialog state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Get available buildings based on selected facility
  const availableBuildings = formData.facilityId ? mockBuildings[formData.facilityId as keyof typeof mockBuildings] || [] : [];
  
  // Get available rooms based on selected building
  const availableRooms = formData.buildingId ? mockRooms[formData.buildingId as keyof typeof mockRooms] || [] : [];

  // Update location when facility, building, or room changes
  useEffect(() => {
    const facility = mockFacilities.find(f => f.id === formData.facilityId)?.name || '';
    const building = availableBuildings.find(b => b.id === formData.buildingId)?.name || '';
    const room = availableRooms.find(r => r.id === formData.roomId)?.number || '';

    let location = facility;
    if (building) location += `, ${building}`;
    if (room) location += `, Room ${room}`;

    setFormData(prev => ({ ...prev, location }));
  }, [formData.facilityId, formData.buildingId, formData.roomId]);

  // Generate a shareable URL when the share dialog opens
  useEffect(() => {
    if (isShareDialogOpen) {
      // Generate a unique token (in a real app, this would be stored in a database)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/maintenance/report/${token}`);
    }
  }, [isShareDialogOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));
    
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Fix toast implementation
  const { toast } = useToast();
  
  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: "Link Copied",
        description: "The form link has been copied to your clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };
  
  // Handle email share
  const handleEmailShare = () => {
    const subject = encodeURIComponent('Report a Maintenance Issue');
    const body = encodeURIComponent(`Please use this link to report a maintenance issue: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  // Handle SMS share
  const handleSmsShare = () => {
    const message = encodeURIComponent(`Please use this link to report a maintenance issue: ${shareUrl}`);
    window.open(`sms:?body=${message}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.location || !formData.systemType || !formData.issueType || 
        !formData.description || !formData.submitterName || !formData.submitterEmail || 
        !formData.submitterPhone) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(formData.submitterEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Calculate urgency score
    const impactScore = { low: 1, medium: 2, high: 3 }[formData.impact];
    const severityScore = { low: 1, medium: 2, high: 3 }[formData.severity];
    const urgencyScore = (impactScore * severityScore) / 9; // Normalize to 0-1 scale

    onSubmit({
      ...formData,
      urgencyScore,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Add Share Button at the top of the form */}
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setIsShareDialogOpen(true)}
          className="flex items-center gap-2"
          id="share-issue-form-button"
        >
          <Share2 className="h-4 w-4" />
          Share Form
        </Button>
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Location Details</h3>
        
        <div className="relative">
          <Label htmlFor="facility">Facility *</Label>
          <Select 
            value={formData.facilityId}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              facilityId: value,
              buildingId: '', // Reset building when facility changes
              roomId: '', // Reset room when facility changes
            }))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {mockFacilities.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.facilityId && (
          <div className="relative">
            <Label htmlFor="building">Building</Label>
            <Select 
              value={formData.buildingId}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                buildingId: value,
                roomId: '', // Reset room when building changes
              }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select building" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {availableBuildings.map(building => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {formData.buildingId && (
          <div className="relative">
            <Label htmlFor="room">Room</Label>
            <Select 
              value={formData.roomId}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                roomId: value,
              }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select room" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {availableRooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="specificLocation">Specific Location Details</Label>
          <Input
            id="specificLocation"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Add any specific location details (e.g., 'Near elevator', 'North wall')"
          />
        </div>
      </div>

      {/* Issue Details Section */}
      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="systemType">System Type *</Label>
          <Select 
            value={formData.systemType}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              systemType: value,
              issueType: '', // Reset issue type when system changes
            }))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select system type" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              {systemTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.systemType && (
          <div className="relative">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select
              value={formData.issueType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, issueType: value }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {issueTypesBySystem[formData.systemType]?.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Please describe the issue in detail..."
            rows={4}
          />
        </div>

        <div>
          <Label>Photos</Label>
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              Upload Photos
            </label>
          </div>
          {previewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Uploaded photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority Assessment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Priority Assessment</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Label htmlFor="impact">Impact</Label>
            <Select
              value={formData.impact}
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, impact: value }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select impact" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${
              formData.impact === 'high' && formData.severity === 'high' ? 'text-red-500' :
              formData.impact === 'high' || formData.severity === 'high' ? 'text-orange-500' :
              'text-yellow-500'
            }`} />
            <span className="font-medium">
              Priority Level: {
                formData.impact === 'high' && formData.severity === 'high' ? 'Critical' :
                formData.impact === 'high' || formData.severity === 'high' ? 'High' :
                formData.impact === 'medium' || formData.severity === 'medium' ? 'Medium' :
                'Low'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        
        <div>
          <Label htmlFor="submitterName">Full Name *</Label>
          <Input
            id="submitterName"
            value={formData.submitterName}
            onChange={(e) => setFormData(prev => ({ ...prev, submitterName: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="submitterEmail">Email *</Label>
          <Input
            id="submitterEmail"
            type="email"
            value={formData.submitterEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, submitterEmail: e.target.value }))}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Label htmlFor="submitterPhone">Phone Number *</Label>
          <Input
            id="submitterPhone"
            value={formData.submitterPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, submitterPhone: e.target.value }))}
            placeholder="Enter your phone number"
          />
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Issue Report Form</DialogTitle>
            <DialogDescription>
              Share this form with others to report maintenance issues.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                readOnly
                value={shareUrl}
                className="w-full"
              />
            </div>
            <Button 
              type="button" 
              size="sm" 
              className="px-3" 
              onClick={handleCopyLink}
            >
              <span className="sr-only">Copy</span>
              {isCopied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleEmailShare}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleSmsShare}
            >
              <MessageSquare className="h-4 w-4" />
              SMS
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogDescription>
              The link will expire in 24 hours.
            </DialogDescription>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full">
        Submit Issue Report
      </Button>
    </form>
  );
} 