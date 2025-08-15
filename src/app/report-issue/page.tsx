'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, QrCode, Loader2, CheckCircle, Upload, Camera } from 'lucide-react';
import { getQRCodeByCode, createIssueReport, type CreateIssueReportData } from '@/app/actions/maintenanceIssues';

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
  { value: 'low', label: 'Low - Can wait', color: 'text-green-600' },
  { value: 'medium', label: 'Medium - Soon', color: 'text-yellow-600' },
  { value: 'high', label: 'High - Urgent', color: 'text-orange-600' },
  { value: 'urgent', label: 'Critical - Immediate', color: 'text-red-600' }
];

function ReportIssueForm() {
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('code');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CreateIssueReportData['category']>('other');
  const [priority, setPriority] = useState<CreateIssueReportData['priority']>('medium');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [images, setImages] = useState<File[]>([]);

  // Load QR code data if provided
  useEffect(() => {
    if (qrCode) {
      loadQRCodeData();
    }
  }, [qrCode]);

  const loadQRCodeData = async () => {
    if (!qrCode) return;
    
    setLoadingQR(true);
    try {
      const result = await getQRCodeByCode(qrCode);
      if (result.data) {
        setQrCodeData(result.data);
      } else {
        toast({
          title: 'Invalid QR Code',
          description: 'The QR code is not valid or has been deactivated.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading QR code data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load location information.',
        variant: 'destructive'
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Upload images to storage first and get URLs
      const imageUrls: string[] = [];
      
      const issueData: CreateIssueReportData = {
        facility_id: qrCodeData?.facility_id || '',
        building_id: qrCodeData?.building_id,
        room_id: qrCodeData?.room_id,
        field_id: qrCodeData?.field_id,
        qr_code_id: qrCodeData?.id,
        title,
        description,
        category,
        priority,
        reporter_name: reporterName || undefined,
        reporter_email: reporterEmail || undefined,
        reporter_phone: reporterPhone || undefined,
        location_type: qrCodeData?.location_type || 'facility',
        location_name: qrCodeData?.location_name || 'Unknown Location',
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
        setSubmitted(true);
        toast({
          title: 'Success',
          description: 'Your issue has been reported successfully.',
        });
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit issue report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Issue Reported Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for reporting this issue. Our maintenance team has been notified and will address it as soon as possible.
            </p>
            <p className="text-sm text-gray-500">
              You can close this page or report another issue.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setTitle('');
                setDescription('');
                setCategory('other');
                setPriority('medium');
                setReporterName('');
                setReporterEmail('');
                setReporterPhone('');
                setImages([]);
              }}
              className="mt-4"
            >
              Report Another Issue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Report Maintenance Issue
            </CardTitle>
            {qrCodeData && (
              <div className="mt-2 flex items-center gap-2 text-blue-100">
                <QrCode className="w-4 h-4" />
                <span className="text-sm">Location: {qrCodeData.location_name}</span>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-6">
            {loadingQR ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Issue Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={(v: any) => setCategory(v)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {issueCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select value={priority} onValueChange={(v: any) => setPriority(v)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide as much detail as possible about the issue..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Photos (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={images.length >= 5}
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
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4 border-t pt-4">
                  <Label className="font-semibold">Your Contact Information (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm">Name</Label>
                      <Input
                        id="name"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Providing contact information helps us follow up if we need more details.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !title || !description || (!qrCodeData && !qrCode)}
                  className="w-full"
                  size="lg"
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
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ReportIssueForm />
    </Suspense>
  );
}





