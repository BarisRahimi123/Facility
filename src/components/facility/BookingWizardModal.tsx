'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  DollarSign,
  Upload,
  AlertCircle,
  Info,
  CheckCircle,
  Shield,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import { format, addDays, parseISO, isAfter, isBefore, differenceInHours } from 'date-fns';
import type { Field } from '@/types/field';
import type { Facility } from '@/types/facility';
import { createReservation, checkFieldAvailability } from '@/app/actions/reservations';
import { useToast } from '@/components/ui/use-toast';

interface BookingWizardModalProps {
  open: boolean;
  onClose: () => void;
  field: Field;
  facility: Facility;
}

interface BookingData {
  // Step 1: Date & Time
  dates: Date[];
  startTime: string;
  endTime: string;
  bookingType: 'hourly' | 'daily';
  
  // Step 2: Event Details
  eventName: string;
  eventType: string;
  eventDescription: string;
  estimatedAttendees: number;
  setupRequirements: string;
  
  // Step 3: Contact Information
  organizationName: string;
  organizationType: 'individual' | 'commercial' | 'nonprofit' | 'school';
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: string;
  emergencyContact: string;
  emergencyPhone: string;
  
  // Step 4: Insurance
  hasInsurance: boolean;
  insuranceFile?: File;
  insuranceProvider?: string;
  policyNumber?: string;
  
  // Step 5: Payment
  paymentMethod: 'credit_card' | 'ach' | 'invoice' | 'mail';
  acceptTerms: boolean;
  acceptLiability: boolean;
  acceptCancellation: boolean;
}

const initialBookingData: BookingData = {
  dates: [],
  startTime: '09:00',
  endTime: '17:00',
  bookingType: 'hourly',
  eventName: '',
  eventType: '',
  eventDescription: '',
  estimatedAttendees: 0,
  setupRequirements: '',
  organizationName: '',
  organizationType: 'individual',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  billingAddress: '',
  emergencyContact: '',
  emergencyPhone: '',
  hasInsurance: false,
  paymentMethod: 'credit_card',
  acceptTerms: false,
  acceptLiability: false,
  acceptCancellation: false,
};

export default function BookingWizardModal({ open, onClose, field, facility }: BookingWizardModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const totalSteps = 5;

  // Calculate costs
  useEffect(() => {
    calculateCosts();
  }, [bookingData.dates, bookingData.startTime, bookingData.endTime, bookingData.bookingType]);

  const calculateCosts = () => {
    if (bookingData.dates.length === 0) {
      setTotalCost(0);
      setDepositAmount(0);
      return;
    }

    let cost = 0;
    
    if (bookingData.bookingType === 'hourly') {
      const hours = differenceInHours(
        parseISO(`2024-01-01T${bookingData.endTime}`),
        parseISO(`2024-01-01T${bookingData.startTime}`)
      );
      cost = field.hourly_rate * hours * bookingData.dates.length;
    } else {
      cost = field.daily_rate * bookingData.dates.length;
    }

    // Add tax (8.5%)
    const tax = cost * 0.085;
    const total = cost + tax;
    
    setTotalCost(total);
    setDepositAmount(total * 0.25); // 25% deposit
  };

  // Check availability for selected dates
  const checkAvailability = async () => {
    if (bookingData.dates.length === 0) return;

    setIsCheckingAvailability(true);
    const availabilityChecks: Record<string, boolean> = {};

    try {
      for (const date of bookingData.dates) {
        const dateStr = format(date, 'yyyy-MM-dd');
        const startDateTime = `${dateStr}T${bookingData.startTime}`;
        const endDateTime = `${dateStr}T${bookingData.endTime}`;
        
        const isAvailable = await checkFieldAvailability(
          field.id,
          startDateTime,
          endDateTime
        );
        
        availabilityChecks[dateStr] = isAvailable;
      }
      
      setAvailability(availabilityChecks);
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleNext = () => {
    // Validate current step
    if (!validateStep(step)) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return bookingData.dates.length > 0 && bookingData.startTime && bookingData.endTime;
      case 2:
        return !!bookingData.eventName && !!bookingData.eventType && bookingData.estimatedAttendees > 0;
      case 3:
        return !!bookingData.organizationName && !!bookingData.contactName && 
               !!bookingData.contactEmail && !!bookingData.contactPhone &&
               !!bookingData.emergencyContact && !!bookingData.emergencyPhone;
      case 4:
        return bookingData.hasInsurance ? !!bookingData.insuranceFile : true;
      case 5:
        return bookingData.acceptTerms && bookingData.acceptLiability && bookingData.acceptCancellation;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields and agreements.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create reservation slots for each date
      const slots = bookingData.dates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        quantity: 1,
      }));

      // TODO: Create organization if needed
      // TODO: Upload insurance document
      // TODO: Create payment intent with Stripe

      // Create reservation
      const reservation = await createReservation({
        organization_id: '', // TODO: Get from auth or create
        field_id: field.id,
        facility_id: facility.id,
        status: 'pending',
        event_name: bookingData.eventName,
        event_type: bookingData.eventType,
        event_description: bookingData.eventDescription,
        estimated_attendees: bookingData.estimatedAttendees,
        setup_requirements: bookingData.setupRequirements,
        contact_name: bookingData.contactName,
        contact_email: bookingData.contactEmail,
        contact_phone: bookingData.contactPhone,
        emergency_contact_name: bookingData.emergencyContact,
        emergency_contact_phone: bookingData.emergencyPhone,
        subtotal: totalCost / 1.085, // Remove tax for subtotal
        tax_amount: totalCost * 0.085 / 1.085,
        total_amount: totalCost,
        deposit_amount: depositAmount,
        insurance_status: bookingData.hasInsurance ? 'submitted' : 'not_required',
        payment_status: 'pending',
        payment_method: bookingData.paymentMethod,
        slots: slots,
      });

      toast({
        title: 'Reservation Submitted!',
        description: 'Your reservation has been submitted for approval. You will receive an email confirmation shortly.',
      });

      // Reset and close
      setBookingData(initialBookingData);
      setStep(1);
      onClose();
      
      // TODO: Redirect to confirmation page or payment page
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit reservation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select Dates & Times</h3>
              
              {/* Booking Type */}
              <div className="mb-6">
                <Label>Booking Type</Label>
                <RadioGroup 
                  value={bookingData.bookingType}
                  onValueChange={(value) => setBookingData({ ...bookingData, bookingType: value as 'hourly' | 'daily' })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly" className="cursor-pointer">
                      Hourly (${field.hourly_rate}/hr)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily" className="cursor-pointer">
                      Full Day (${field.daily_rate}/day)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Calendar */}
              <div className="mb-6">
                <Label>Select Date(s)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  You can select multiple dates for recurring bookings
                </p>
                <Calendar
                  mode="multiple"
                  selected={bookingData.dates}
                  onSelect={(dates) => {
                    setBookingData({ ...bookingData, dates: dates || [] });
                    if (dates) checkAvailability();
                  }}
                  disabled={(date) => isBefore(date, new Date())}
                  className="rounded-md border"
                />
              </div>

              {/* Time Selection */}
              {bookingData.bookingType === 'hourly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={bookingData.startTime}
                      onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={bookingData.endTime}
                      onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Selected Dates Summary */}
              {bookingData.dates.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Dates:</h4>
                  <div className="space-y-1">
                    {bookingData.dates.map((date, index) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isAvailable = availability[dateStr];
                      
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{format(date, 'MMMM d, yyyy')}</span>
                          {isCheckingAvailability ? (
                            <Badge variant="outline">Checking...</Badge>
                          ) : isAvailable === false ? (
                            <Badge variant="destructive">Not Available</Badge>
                          ) : isAvailable === true ? (
                            <Badge variant="default" className="bg-green-500">Available</Badge>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Event Details</h3>
            
            <div>
              <Label htmlFor="event-name">Event Name *</Label>
              <Input
                id="event-name"
                placeholder="e.g., Youth Soccer Practice"
                value={bookingData.eventName}
                onChange={(e) => setBookingData({ ...bookingData, eventName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="event-type">Event Type *</Label>
              <Select 
                value={bookingData.eventType}
                onValueChange={(value) => setBookingData({ ...bookingData, eventType: value })}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sports_practice">Sports Practice</SelectItem>
                  <SelectItem value="sports_game">Sports Game/Match</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                  <SelectItem value="camp">Camp/Clinic</SelectItem>
                  <SelectItem value="meeting">Meeting/Gathering</SelectItem>
                  <SelectItem value="party">Party/Celebration</SelectItem>
                  <SelectItem value="educational">Educational Program</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event-description">Event Description</Label>
              <Textarea
                id="event-description"
                placeholder="Please provide details about your event..."
                rows={4}
                value={bookingData.eventDescription}
                onChange={(e) => setBookingData({ ...bookingData, eventDescription: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="attendees">Estimated Number of Attendees *</Label>
              <Input
                id="attendees"
                type="number"
                min="1"
                max={field.capacity || 1000}
                placeholder={`Maximum capacity: ${field.capacity || 'N/A'}`}
                value={bookingData.estimatedAttendees || ''}
                onChange={(e) => setBookingData({ ...bookingData, estimatedAttendees: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="setup">Special Setup Requirements</Label>
              <Textarea
                id="setup"
                placeholder="e.g., Need goal posts set up, require access to electricity..."
                rows={3}
                value={bookingData.setupRequirements}
                onChange={(e) => setBookingData({ ...bookingData, setupRequirements: e.target.value })}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            
            <div>
              <Label htmlFor="org-type">Organization Type *</Label>
              <RadioGroup 
                value={bookingData.organizationType}
                onValueChange={(value) => setBookingData({ ...bookingData, organizationType: value as any })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="individual" />
                  <Label htmlFor="individual" className="cursor-pointer">Individual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nonprofit" id="nonprofit" />
                  <Label htmlFor="nonprofit" className="cursor-pointer">Non-profit Organization</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="commercial" id="commercial" />
                  <Label htmlFor="commercial" className="cursor-pointer">Commercial/For-profit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="school" id="school" />
                  <Label htmlFor="school" className="cursor-pointer">School/Educational</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="org-name">Organization/Group Name *</Label>
              <Input
                id="org-name"
                placeholder="e.g., Riverside Youth Soccer League"
                value={bookingData.organizationName}
                onChange={(e) => setBookingData({ ...bookingData, organizationName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-name">Contact Name *</Label>
                <Input
                  id="contact-name"
                  placeholder="Full name"
                  value={bookingData.contactName}
                  onChange={(e) => setBookingData({ ...bookingData, contactName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="email@example.com"
                  value={bookingData.contactEmail}
                  onChange={(e) => setBookingData({ ...bookingData, contactEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact-phone">Phone Number *</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={bookingData.contactPhone}
                  onChange={(e) => setBookingData({ ...bookingData, contactPhone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="billing-address">Billing Address</Label>
                <Input
                  id="billing-address"
                  placeholder="Street address"
                  value={bookingData.billingAddress}
                  onChange={(e) => setBookingData({ ...bookingData, billingAddress: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency-name">Emergency Contact Name *</Label>
                  <Input
                    id="emergency-name"
                    placeholder="Full name"
                    value={bookingData.emergencyContact}
                    onChange={(e) => setBookingData({ ...bookingData, emergencyContact: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="emergency-phone">Emergency Phone *</Label>
                  <Input
                    id="emergency-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={bookingData.emergencyPhone}
                    onChange={(e) => setBookingData({ ...bookingData, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Insurance Requirements</h3>
            
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">Certificate of Insurance Required</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Minimum $1,000,000 general liability coverage</li>
                    <li>• {facility.name} must be listed as additional insured</li>
                    <li>• Must be submitted before final approval</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Label>Do you currently have liability insurance?</Label>
              <RadioGroup 
                value={bookingData.hasInsurance ? 'yes' : 'no'}
                onValueChange={(value) => setBookingData({ ...bookingData, hasInsurance: value === 'yes' })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="has-insurance" />
                  <Label htmlFor="has-insurance" className="cursor-pointer">
                    Yes, I have insurance
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no-insurance" />
                  <Label htmlFor="no-insurance" className="cursor-pointer">
                    No, I need to obtain insurance
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {bookingData.hasInsurance && (
              <>
                <div>
                  <Label htmlFor="insurance-provider">Insurance Provider</Label>
                  <Input
                    id="insurance-provider"
                    placeholder="e.g., State Farm, Allstate"
                    value={bookingData.insuranceProvider || ''}
                    onChange={(e) => setBookingData({ ...bookingData, insuranceProvider: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="policy-number">Policy Number</Label>
                  <Input
                    id="policy-number"
                    placeholder="Policy #"
                    value={bookingData.policyNumber || ''}
                    onChange={(e) => setBookingData({ ...bookingData, policyNumber: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="insurance-upload">Upload Certificate of Insurance (COI)</Label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="insurance-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG (MAX. 10MB)</p>
                        </div>
                        <input 
                          id="insurance-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setBookingData({ ...bookingData, insuranceFile: file });
                          }}
                        />
                      </label>
                    </div>
                    {bookingData.insuranceFile && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selected: {bookingData.insuranceFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {!bookingData.hasInsurance && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Insurance Options</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      You can obtain insurance through:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Your homeowner's or renter's insurance (may cover events)</li>
                      <li>• Special event insurance providers</li>
                      <li>• The District's approved insurance partner (additional fee applies)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4">Review & Payment</h3>
            
            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Facility:</span>
                  <span className="font-medium">{facility.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Space:</span>
                  <span className="font-medium">{field.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium">{bookingData.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-medium">{bookingData.dates.length} day(s)</span>
                </div>
                {bookingData.bookingType === 'hourly' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{bookingData.startTime} - {bookingData.endTime}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${(totalCost / 1.085).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8.5%):</span>
                  <span>${(totalCost * 0.085 / 1.085).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-3">
                  <span>Total:</span>
                  <span className="text-primary">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Deposit Due (25%):</span>
                  <span className="font-semibold">${depositAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <div>
              <Label>Payment Method</Label>
              <RadioGroup 
                value={bookingData.paymentMethod}
                onValueChange={(value) => setBookingData({ ...bookingData, paymentMethod: value as any })}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="cursor-pointer flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit/Debit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ach" id="ach" />
                  <Label htmlFor="ach" className="cursor-pointer">
                    ACH/Bank Transfer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invoice" id="invoice" />
                  <Label htmlFor="invoice" className="cursor-pointer">
                    Invoice (Net 30)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mail" id="mail" />
                  <Label htmlFor="mail" className="cursor-pointer">
                    Check by Mail
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-3">
              <h4 className="font-medium">Terms & Agreements</h4>
              
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms"
                  checked={bookingData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setBookingData({ ...bookingData, acceptTerms: checked === true })
                  }
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to the facility rental terms and conditions
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="liability"
                  checked={bookingData.acceptLiability}
                  onCheckedChange={(checked) => 
                    setBookingData({ ...bookingData, acceptLiability: checked === true })
                  }
                />
                <Label htmlFor="liability" className="text-sm cursor-pointer">
                  I understand and accept the liability waiver requirements
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="cancellation"
                  checked={bookingData.acceptCancellation}
                  onCheckedChange={(checked) => 
                    setBookingData({ ...bookingData, acceptCancellation: checked === true })
                  }
                />
                <Label htmlFor="cancellation" className="text-sm cursor-pointer">
                  I understand and accept the cancellation policy
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Select Dates & Times';
      case 2: return 'Event Details';
      case 3: return 'Contact Information';
      case 4: return 'Insurance Requirements';
      case 5: return 'Review & Payment';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Reserve {field.name}</DialogTitle>
          <DialogDescription>
            Complete your reservation for {facility.name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i === step 
                    ? 'bg-primary text-primary-foreground' 
                    : i < step 
                    ? 'bg-green-500 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <CheckCircle className="h-5 w-5" /> : i}
              </div>
              {i < 5 && (
                <div 
                  className={`w-full h-1 mx-2 transition-colors ${
                    i < step ? 'bg-green-500' : 'bg-muted'
                  }`} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-1">
          {renderStepContent()}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
          </div>

          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={loading}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !validateStep(step)}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : `Pay Deposit ($${depositAmount.toFixed(2)})`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 