'use client';

import { Field, CreateReservationRequest } from '@/types/field';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  DollarSign, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  Star, 
  Lightbulb, 
  Car, 
  Accessibility, 
  Wifi, 
  Shield,
  Phone,
  Mail,
  ExternalLink,
  Camera,
  Play,
  Grid3X3,
  Ruler,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  LogIn
} from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface FieldDetailModalProps {
  field: Field | null;
  isOpen: boolean;
  onClose: () => void;
  onReserveField?: (field: Field, reservationData: any) => void;
}

interface ReservationData {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  duration: number;
  totalCost: number;
  reservationType: 'hourly' | 'daily';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  organization: string;
  purpose: string;
  specialRequests: string;
  estimatedAttendees: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  agreedToTerms: boolean;
  agreedToLiability: boolean;
  // Payment breakdown
  subtotal: number;
  taxAmount: number;
  depositAmount: number;
  // Insurance and documentation
  insuranceCertificate?: File;
  additionalDocuments?: File[];
}

export function FieldDetailModal({ field, isOpen, onClose, onReserveField }: FieldDetailModalProps) {
  const [currentStep, setCurrentStep] = useState<'details' | 'booking' | 'auth-required'>('details');
  const [reservationData, setReservationData] = useState<ReservationData>({
    date: undefined,
    startTime: '',
    endTime: '',
    duration: 1,
    totalCost: 0,
    reservationType: 'hourly',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    organization: '',
    purpose: '',
    specialRequests: '',
    estimatedAttendees: 0,
    emergencyContactName: '',
    emergencyContactPhone: '',
    agreedToTerms: false,
    agreedToLiability: false,
    subtotal: 0,
    taxAmount: 0,
    depositAmount: 0
  });
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();

  const fieldTypeEmoji = {
    soccer: '⚽',
    football: '🏈', 
    basketball: '🏀',
    tennis: '🎾',
    baseball: '⚾',
    swimming: '🏊',
    track: '🏃',
    multipurpose: '🏟️'
  };

  const handleReserveClick = () => {
    setCurrentStep('booking');
  };

  const handleBackToDetails = () => {
    setCurrentStep('details');
  };

  const calculateCost = () => {
    if (!reservationData.date || !reservationData.startTime || !reservationData.endTime || !field) {
      return { subtotal: 0, taxAmount: 0, depositAmount: 0, totalCost: 0 };
    }
    
    let subtotal = 0;
    
    if (reservationData.reservationType === 'daily') {
      subtotal = field.daily_rate || 0;
    } else {
      const rate = field.hourly_rate || 0;
      const startHour = parseInt(reservationData.startTime.split(':')[0]);
      const endHour = parseInt(reservationData.endTime.split(':')[0]);
      const duration = endHour - startHour;
      subtotal = rate * Math.max(1, duration);
    }
    
    // Calculate tax (8.5% as example)
    const taxRate = 0.085;
    const taxAmount = subtotal * taxRate;
    
    // Calculate deposit (25% of subtotal)
    const depositRate = 0.25;
    const depositAmount = subtotal * depositRate;
    
    const totalCost = subtotal + taxAmount;
    
    return { subtotal, taxAmount, depositAmount, totalCost };
  };

  const updateReservationData = (updates: Partial<ReservationData>) => {
    const costs = calculateCost();
    const newData = { 
      ...reservationData, 
      ...updates,
      ...costs
    };
    setReservationData(newData);
  };

  const handleSubmitReservation = () => {
    setCurrentStep('booking');
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const handleDateChange = (dateString: string) => {
    const date = dateString ? new Date(dateString) : undefined;
    updateReservationData({ date });
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const validateReservationForm = () => {
    const errors: string[] = [];
    
    if (!reservationData.date) errors.push("Reservation date is required");
    if (!reservationData.startTime) errors.push("Start time is required");
    if (!reservationData.endTime) errors.push("End time is required");
    if (!reservationData.contactName.trim()) errors.push("Full name is required");
    if (!reservationData.contactEmail.trim()) errors.push("Email address is required");
    if (!reservationData.contactPhone.trim()) errors.push("Phone number is required");
    if (!reservationData.purpose.trim()) errors.push("Purpose of use is required");
    if (!reservationData.estimatedAttendees || reservationData.estimatedAttendees < 1) errors.push("Number of attendees is required");
    if (!reservationData.emergencyContactName.trim()) errors.push("Emergency contact name is required");
    if (!reservationData.emergencyContactPhone.trim()) errors.push("Emergency contact phone is required");
    if (!reservationData.agreedToTerms) errors.push("You must agree to the terms and conditions");
    if (!reservationData.agreedToLiability) errors.push("You must acknowledge liability agreement");
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (reservationData.contactEmail && !emailRegex.test(reservationData.contactEmail)) {
      errors.push("Please enter a valid email address");
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (reservationData.contactPhone && !phoneRegex.test(reservationData.contactPhone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push("Please enter a valid phone number");
    }
    
    // Capacity validation
    if (field && field.capacity && reservationData.estimatedAttendees > field.capacity) {
      errors.push(`Number of attendees cannot exceed field capacity (${field.capacity})`);
    }
    
    // Time validation
    if (reservationData.startTime && reservationData.endTime) {
      const startHour = parseInt(reservationData.startTime.split(':')[0]);
      const endHour = parseInt(reservationData.endTime.split(':')[0]);
      if (endHour <= startHour) {
        errors.push("End time must be after start time");
      }
    }
    
    return { isValid: errors.length === 0, missingFields: errors };
  };

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (user && !userLoading) {
      setReservationData(prev => ({
        ...prev,
        contactName: user.name || '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        organization: (user.type === 'external' || user.type === 'vendor') ? user.company : ''
      }));
    }
  }, [user, userLoading]);

  // Check for pending reservation after authentication
  useEffect(() => {
    if (user && !userLoading && typeof window !== 'undefined') {
      const pendingReservation = localStorage.getItem('pendingFieldDetailReservation');
      if (pendingReservation) {
        try {
          const savedData = JSON.parse(pendingReservation);
          console.log('Found pending reservation, restoring data...', savedData);
          
          // Clear the pending reservation
          localStorage.removeItem('pendingFieldDetailReservation');
          
          // Restore the reservation data
          if (savedData.reservationData) {
            setReservationData(prev => ({
              ...savedData.reservationData,
              // Update contact info with authenticated user data
              contactName: user.name || savedData.reservationData.contactName,
              contactEmail: user.email || savedData.reservationData.contactEmail,
              contactPhone: user.phone || savedData.reservationData.contactPhone,
              organization: (user.type === 'external' || user.type === 'vendor') ? user.company : savedData.reservationData.organization
            }));
          }
          
          // Auto-submit the reservation
          setCurrentStep('booking');
          toast({
            title: "Welcome back!",
            description: "We've restored your reservation details. Please click submit to complete your booking.",
          });
          
        } catch (error) {
          console.error('Error processing pending reservation:', error);
        }
      }
    }
  }, [user, userLoading]);

  // Early return after all hooks to comply with Rules of Hooks
  if (!field) return null;

  const handleReservationSubmit = async () => {
    if (!field) return;
    
    // Check if user is authenticated
    if (!user && !userLoading) {
      // Save reservation data to localStorage before showing auth modal
      const reservationDataToSave = {
        field,
        reservationData,
        costBreakdown: calculateCost()
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingFieldDetailReservation', JSON.stringify(reservationDataToSave));
      }
      
      setCurrentStep('auth-required');
      
      // Auto-redirect to sign-up page after showing the modal
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/sign-up';
        }
      }, 2000); // Show modal for 2 seconds before redirecting
      
      return;
    }

    const validationResult = validateReservationForm();
    if (!validationResult.isValid) {
      alert(`Please complete the following required fields:\n\n${validationResult.missingFields.join('\n')}`);
      return;
    }

    // Calculate all cost components
    const costBreakdown = calculateCost();
    
    // Prepare reservation payload
    const reservationPayload: CreateReservationRequest = {
      field_id: field.id,
      start_time: reservationData.date ? new Date(`${reservationData.date.toISOString().split('T')[0]}T${reservationData.startTime}:00`).toISOString() : '',
      end_time: reservationData.date ? new Date(`${reservationData.date.toISOString().split('T')[0]}T${reservationData.endTime}:00`).toISOString() : '',
      booking_type: reservationData.reservationType,
      renter_name: reservationData.contactName,
      renter_email: reservationData.contactEmail,
      renter_phone: reservationData.contactPhone || undefined,
      organization_name: reservationData.organization || undefined,
      purpose_of_use: reservationData.purpose,
      estimated_attendees: reservationData.estimatedAttendees || undefined,
      special_requests: reservationData.specialRequests || undefined,
      emergency_contact_name: reservationData.emergencyContactName,
      emergency_contact_phone: reservationData.emergencyContactPhone,
    };
    
    console.log('Creating reservation with payload:', reservationPayload);
    
    try {
      // Create the reservation using the server action
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }

      const result = await response.json();
      const reservation = result.reservation;
      
      // Show success message
      const approvalMessage = field.requires_approval 
        ? "Your reservation has been submitted and is pending approval. You will receive an email and SMS notification once it's reviewed by our team."
        : "Your reservation has been confirmed! You will receive confirmation details via email and SMS.";
        
      alert(`Reservation Created Successfully! 🎉\n\nField: ${field.name}\nDate: ${reservationData.date?.toLocaleDateString()}\nTime: ${reservationData.startTime} - ${reservationData.endTime}\nTotal: $${reservationData.totalCost.toFixed(2)}\nReservation ID: ${reservation.id.slice(0, 8)}\n\n${approvalMessage}\n\nPayment instructions will be sent separately.`);
        
      // Call the callback to update parent component
      onReserveField && onReserveField(field, reservation);
      onClose();
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(`Failed to create reservation: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  // Render authentication required step
  const renderAuthRequiredStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="w-20 h-20 bg-purple-600/20 rounded-full mx-auto flex items-center justify-center">
        <UserPlus className="h-10 w-10 text-purple-400" />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-white">
          Sign In Required
        </h3>
        <p className="text-gray-300 max-w-md mx-auto">
          To complete your reservation for <strong className="text-purple-400">{field?.name}</strong>, please create an account or sign in to your existing account.
        </p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mx-auto max-w-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Date:</span>
            <span className="font-medium text-white">{reservationData.date?.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Time:</span>
            <span className="font-medium text-white">{reservationData.startTime} - {reservationData.endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="font-medium text-white capitalize">{reservationData.reservationType}</span>
          </div>
          <div className="border-t border-gray-600 pt-2 flex justify-between">
            <span className="text-gray-400">Total:</span>
            <span className="font-semibold text-purple-400">${reservationData.totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/auth/sign-up">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        </Link>
        
        <Link href="/auth/sign-in">
          <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </Link>

        <Button 
          variant="ghost" 
          className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => setCurrentStep('booking')}
        >
          Continue Editing
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        Your reservation details will be saved when you return.
      </p>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400 mb-2">
          Redirecting to sign up page...
        </p>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{fieldTypeEmoji[field.type as keyof typeof fieldTypeEmoji] || '🏟️'}</span>
            {currentStep === 'details' ? field.name : 'Reserve Field'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'details' && (
          <div className="space-y-6">
            {/* Field Images */}
            {field.gallery_images && Array.isArray(field.gallery_images) && field.gallery_images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {field.gallery_images.slice(0, 3).map((image: string, index: number) => (
                  <div key={index} className="relative h-48 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`${field.name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5 text-purple-400" />
                    Field Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">Type:</span>
                      <p className="text-white font-medium capitalize">{field.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Surface:</span>
                      <p className="text-white font-medium capitalize">{field.surface_type?.replace('_', ' ') || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Dimensions:</span>
                      <p className="text-white font-medium">{field.dimensions || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Capacity:</span>
                      <p className="text-white font-medium">{field.capacity} people</p>
                    </div>
                    {(field.full_address || field.street_address) && (
                      <div>
                        <span className="text-gray-400 text-sm">Location:</span>
                        <p className="text-white font-medium flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-purple-400" />
                          {field.full_address || `${field.street_address}${field.city ? ', ' + field.city : ''}${field.state ? ', ' + field.state : ''}`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Pricing
                  </h3>
                  <div className="space-y-3">
                    {field.hourly_rate && (
                      <div>
                        <span className="text-gray-400 text-sm">Hourly Rate:</span>
                        <p className="text-white font-medium text-lg">${field.hourly_rate}/hour</p>
                      </div>
                    )}
                    {field.daily_rate && (
                      <div>
                        <span className="text-gray-400 text-sm">Daily Rate:</span>
                        <p className="text-white font-medium text-lg">${field.daily_rate}/day</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-sm">Reservation Type:</span>
                      <p className="text-white font-medium">
                        {field.instant_booking ? 'Instant Reservation' : 'Requires Approval'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Amenities */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Amenities & Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {field.has_lighting && (
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-400" />
                      <span className="text-gray-300 text-sm">Lighting</span>
                    </div>
                  )}
                  {field.has_parking && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300 text-sm">Parking {field.parking_spots ? `(${field.parking_spots} spots)` : ''}</span>
                    </div>
                  )}
                  {field.ada_compliant && (
                    <div className="flex items-center gap-2">
                      <Accessibility className="h-4 w-4 text-green-400" />
                      <span className="text-gray-300 text-sm">ADA Compliant</span>
                    </div>
                  )}
                  {field.has_restrooms && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      <span className="text-gray-300 text-sm">Restrooms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {field.description && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{field.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Virtual Tour */}
            {field.virtual_tour_url && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Play className="h-5 w-5 text-red-400" />
                    Virtual Tour
                  </h3>
                  <Button 
                    variant="outline" 
                    className="border-gray-600 text-white hover:bg-gray-700"
                    onClick={() => window.open(field.virtual_tour_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Virtual Tour
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reserve Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleReserveClick}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 text-lg"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Reserve This Field
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'booking' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={handleBackToDetails}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Details
              </Button>
              <div className="text-sm text-gray-400">
                Step 2 of 2: Complete Your Reservation
              </div>
            </div>

            {/* Date/Time and Contact Information - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Date & Time Selection */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Date & Time</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Reservation Type</Label>
                      <Select 
                        value={reservationData.reservationType} 
                        onValueChange={(value: 'hourly' | 'daily') => updateReservationData({ reservationType: value })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select reservation type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="hourly" className="text-white hover:bg-gray-700">
                            Hourly (${field.hourly_rate}/hour)
                          </SelectItem>
                          <SelectItem value="daily" className="text-white hover:bg-gray-700">
                            Daily (${field.daily_rate}/day)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Select Date</Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={reservationData.date ? reservationData.date.toISOString().split('T')[0] : ''}
                        onChange={(e) => updateReservationData({ date: e.target.value ? new Date(e.target.value) : undefined })}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>

                    {reservationData.reservationType === 'hourly' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300 mb-2 block">Start Time</Label>
                          <Select value={reservationData.startTime} onValueChange={(value) => updateReservationData({ startTime: value })}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-gray-300 mb-2 block">End Time</Label>
                          <Select value={reservationData.endTime} onValueChange={(value) => updateReservationData({ endTime: value })}>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time} className="text-white hover:bg-gray-700">
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-white">Total Cost:</span>
                        <span className="text-2xl font-bold text-green-400">${reservationData.totalCost}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 mb-2 block">Full Name *</Label>
                      <Input
                        value={reservationData.contactName}
                        onChange={(e) => updateReservationData({ contactName: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-300 mb-2 block">Organization</Label>
                      <Input
                        value={reservationData.organization}
                        onChange={(e) => updateReservationData({ organization: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="School, company, or organization"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Email Address *</Label>
                      <Input
                        type="email"
                        value={reservationData.contactEmail}
                        onChange={(e) => updateReservationData({ contactEmail: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-300 mb-2 block">Phone Number *</Label>
                      <Input
                        type="tel"
                        value={reservationData.contactPhone}
                        onChange={(e) => updateReservationData({ contactPhone: e.target.value })}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Estimated Attendees *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={reservationData.estimatedAttendees || ''}
                          onChange={(e) => updateReservationData({ estimatedAttendees: parseInt(e.target.value) || 0 })}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Number of people"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-300 mb-2 block">Special Requests</Label>
                        <Input
                          value={reservationData.specialRequests}
                          onChange={(e) => updateReservationData({ specialRequests: e.target.value })}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Any special requirements"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Details */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Event Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Purpose of Use *</Label>
                    <Textarea
                      value={reservationData.purpose}
                      onChange={(e) => updateReservationData({ purpose: e.target.value })}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Describe the purpose of your reservation"
                      rows={3}
                    />
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-white mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 mb-2 block">Emergency Contact Name *</Label>
                        <Input
                          value={reservationData.emergencyContactName}
                          onChange={(e) => updateReservationData({ emergencyContactName: e.target.value })}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Emergency contact full name"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-300 mb-2 block">Emergency Contact Phone *</Label>
                        <Input
                          type="tel"
                          value={reservationData.emergencyContactPhone}
                          onChange={(e) => updateReservationData({ emergencyContactPhone: e.target.value })}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Emergency contact phone"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-white mb-3">Insurance & Documentation</h4>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Insurance Certificate (Optional)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          updateReservationData({ insuranceCertificate: file });
                        }}
                        className="bg-gray-800 border-gray-600 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1"
                      />
                      <p className="text-xs text-gray-400 mt-1">Upload liability insurance certificate if available</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300">
                      {reservationData.reservationType === 'daily' ? 'Daily Rate' : 'Hourly Rate'}
                    </span>
                    <span className="text-white font-medium">
                      ${reservationData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300">Tax (8.5%)</span>
                    <span className="text-white font-medium">
                      ${reservationData.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-gray-300">Total Amount</span>
                    <span className="text-white font-semibold text-lg">
                      ${reservationData.totalCost.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="bg-purple-900/30 p-4 rounded-lg mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-200">Deposit Required (25%)</span>
                      <span className="text-purple-200 font-semibold">
                        ${reservationData.depositAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-purple-300 mt-1">
                      Remaining balance (${(reservationData.totalCost - reservationData.depositAmount).toFixed(2)}) due at time of use
                    </p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg mt-4">
                    <h4 className="text-sm font-semibold text-white mb-2">Payment Options</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">Credit/Debit Card (Stripe)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">Bank Transfer (ACH)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">Digital Wallets (Apple Pay, Google Pay)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Terms & Conditions</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-white mb-2">Cancellation Policy</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• 48+ hours: Full refund minus processing fee</li>
                      <li>• 24-48 hours: 50% refund</li>
                      <li>• Less than 24 hours: No refund</li>
                      <li>• Weather cancellations: Full refund or reschedule</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-white mb-2">Usage Requirements</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Facility must be left in original condition</li>
                      <li>• No smoking, alcohol, or illegal substances</li>
                      <li>• Maximum capacity: {field.capacity} people</li>
                      <li>• Quiet hours: 10 PM - 7 AM</li>
                      <li>• Parking available for {field.parking_spots || 'limited'} vehicles</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        I agree to the <span className="text-purple-400 underline cursor-pointer">Terms of Service</span> and <span className="text-purple-400 underline cursor-pointer">Facility Usage Agreement</span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={reservationData.agreedToTerms ? 'default' : 'outline'}
                          className={reservationData.agreedToTerms ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => updateReservationData({ agreedToTerms: true })}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={!reservationData.agreedToTerms ? 'default' : 'outline'}
                          className={!reservationData.agreedToTerms ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => updateReservationData({ agreedToTerms: false })}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        I acknowledge and accept full liability for any damages or injuries that may occur during the reservation period
                      </div>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          size="sm"
                          variant={reservationData.agreedToLiability ? 'default' : 'outline'}
                          className={reservationData.agreedToLiability ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => updateReservationData({ agreedToLiability: true })}
                        >
                          Yes
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={!reservationData.agreedToLiability ? 'default' : 'outline'}
                          className={!reservationData.agreedToLiability ? 'bg-red-600 hover:bg-red-700' : ''}
                          onClick={() => updateReservationData({ agreedToLiability: false })}
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reservation Summary */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Reservation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-400 text-sm">Field:</span>
                    <p className="text-white font-medium">{field.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Date:</span>
                    <p className="text-white font-medium">
                      {reservationData.date ? reservationData.date.toLocaleDateString() : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Time:</span>
                    <p className="text-white font-medium">
                      {reservationData.reservationType === 'daily' 
                        ? 'All Day' 
                        : `${reservationData.startTime} - ${reservationData.endTime}`
                      }
                    </p>
                  </div>
                </div>
                <Separator className="my-4 bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total Cost:</span>
                  <span className="text-2xl font-bold text-green-400">${reservationData.totalCost}</span>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReservationSubmit}
                disabled={!reservationData.date || !reservationData.contactName || !reservationData.contactEmail || !reservationData.contactPhone || !reservationData.purpose || !reservationData.estimatedAttendees || !reservationData.emergencyContactName || !reservationData.emergencyContactPhone || !reservationData.agreedToTerms || !reservationData.agreedToLiability}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reservationData.totalCost > 0 
                  ? `Pay Deposit $${reservationData.depositAmount.toFixed(2)} & Reserve` 
                  : 'Complete Reservation'
                }
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'auth-required' && renderAuthRequiredStep()}
      </DialogContent>
    </Dialog>
  );
} 