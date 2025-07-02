'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign,
  Building2,
  Info,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Car,
  Lightbulb,
  Accessibility,
  ChevronRight
} from 'lucide-react';
import { getFacilityById } from '@/app/actions/facilities';
import { getFields } from '@/app/actions/fields';
import type { Facility } from '@/types/facility';
import type { Field } from '@/types/field';
import type { Organization } from '@/types/reservation';
import BookingWizardModal from '@/components/facility/BookingWizardModal';

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.facilityId as string;

  const [facility, setFacility] = useState<Facility | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showBookingWizard, setShowBookingWizard] = useState(false);

  useEffect(() => {
    if (facilityId) {
      loadFacilityData();
    }
  }, [facilityId]);

  const loadFacilityData = async () => {
    try {
      const [facilityData, fieldsData] = await Promise.all([
        getFacilityById(facilityId),
        getFields(facilityId)
      ]);

      setFacility(facilityData);
      setFields(fieldsData || []);
    } catch (error) {
      console.error('Error loading facility data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldBooking = (field: Field) => {
    setSelectedField(field);
    setShowBookingWizard(true);
  };

  const getFieldIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'soccer field':
      case 'football':
        return '⚽';
      case 'basketball court':
        return '🏀';
      case 'tennis court':
        return '🎾';
      case 'baseball field':
        return '⚾';
      case 'pool':
        return '🏊';
      case 'track':
        return '🏃';
      case 'classroom':
        return '🏫';
      case 'gymnasium':
        return '🏋️';
      default:
        return '🏟️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Facility Not Found</h2>
        <p className="text-muted-foreground mb-4">The facility you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/rentals')}>
          Back to Search
        </Button>
      </div>
    );
  }

  const availableFields = fields.filter(field => field.status === 'available');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-foreground">{facility.name}</h1>
                <Badge 
                  variant={facility.status === 'active' ? 'default' : 'secondary'}
                  className={facility.status === 'active' ? 'bg-green-500' : ''}
                >
                  {facility.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{facility.address}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{facility.facility_type?.replace('_', ' ')}</span>
                </div>
                {facility.square_footage && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="text-foreground">{facility.square_footage.toLocaleString()} sq ft</span>
                  </div>
                )}
                {facility.year_built && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Built:</span>
                    <span className="text-foreground">{facility.year_built}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Card className="bg-card/50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Available Spaces</p>
                    <p className="text-3xl font-bold text-primary">{availableFields.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push('/rentals')}
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Continue Browsing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="spaces" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="spaces">Available Spaces</TabsTrigger>
            <TabsTrigger value="info">Facility Info</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          {/* Available Spaces Tab */}
          <TabsContent value="spaces" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-foreground">
                Available Spaces ({availableFields.length})
              </h2>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Hourly Rates
                </Badge>
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Daily Rates
                </Badge>
              </div>
            </div>

            {availableFields.length === 0 ? (
              <Card className="bg-card/50">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Available Spaces
                  </h3>
                  <p className="text-muted-foreground">
                    There are currently no spaces available for rental at this facility.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableFields.map(field => (
                  <Card 
                    key={field.id} 
                    className="bg-card hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => handleFieldBooking(field)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getFieldIcon(field.type)}</span>
                          <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {field.name}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {field.type} • {field.surface_type?.replace('_', ' ') || 'Standard'}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Pricing */}
                      <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Hourly</p>
                          <p className="text-lg font-semibold text-foreground">${field.hourly_rate}/hr</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Daily</p>
                          <p className="text-lg font-semibold text-foreground">${field.daily_rate}/day</p>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2">
                        {field.capacity && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Capacity: {field.capacity} people</span>
                          </div>
                        )}
                        {field.dimensions && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Dimensions:</span>
                            <span>{field.dimensions}</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-2">
                        {field.has_lighting && (
                          <Badge variant="secondary" className="text-xs">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Lighting
                          </Badge>
                        )}
                        {field.has_parking && (
                          <Badge variant="secondary" className="text-xs">
                            <Car className="h-3 w-3 mr-1" />
                            Parking
                          </Badge>
                        )}
                        {field.ada_compliant && (
                          <Badge variant="secondary" className="text-xs">
                            <Accessibility className="h-3 w-3 mr-1" />
                            ADA
                          </Badge>
                        )}
                      </div>

                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                        Reserve This Space
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Facility Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Facility Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>(555) 123-4567</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>rentals@facility.com</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Operating Hours</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monday - Friday</span>
                        <span>6:00 AM - 10:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saturday</span>
                        <span>7:00 AM - 9:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sunday</span>
                        <span>8:00 AM - 8:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Facility Features</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Security System</Badge>
                    <Badge variant="outline">Public Transit Access</Badge>
                    <Badge variant="outline">On-site Staff</Badge>
                    <Badge variant="outline">Restrooms</Badge>
                    <Badge variant="outline">First Aid Station</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Policies & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Insurance Requirements
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Certificate of Insurance (COI) required for all rentals</li>
                    <li>• Minimum $1,000,000 general liability coverage</li>
                    <li>• District must be named as additional insured</li>
                    <li>• COI must be submitted 48 hours before event</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Cancellation Policy</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Full refund if cancelled 7+ days before event</li>
                    <li>• 50% refund if cancelled 3-6 days before event</li>
                    <li>• No refund if cancelled less than 3 days before event</li>
                    <li>• Weather-related cancellations handled case-by-case</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">Usage Guidelines</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• No alcohol without special permit</li>
                    <li>• Clean-up required within 30 minutes of end time</li>
                    <li>• Noise ordinances must be followed</li>
                    <li>• All participants must sign liability waivers</li>
                    <li>• Security deposit may be required for certain events</li>
                  </ul>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Important Note</p>
                      <p className="text-sm text-muted-foreground">
                        All rentals are subject to approval. Additional requirements may apply 
                        based on event type and size. Contact our office for specific questions.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Wizard Modal */}
      {selectedField && (
        <BookingWizardModal
          open={showBookingWizard}
          onClose={() => {
            setShowBookingWizard(false);
            setSelectedField(null);
          }}
          field={selectedField}
          facility={facility}
        />
      )}
    </div>
  );
} 