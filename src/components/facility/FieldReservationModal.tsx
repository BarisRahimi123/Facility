'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Users, AlertCircle, CheckCircle, XCircle, Ban, Info, ChevronLeft, ChevronRight, UserPlus, LogIn } from 'lucide-react';
import { Field, Reservation, FieldBlackoutDate, CreateReservationRequest } from '@/types/field';
import { FieldAvailabilityService, AvailabilityCheck } from '@/lib/fieldAvailability';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

interface FieldReservationModalProps {
  field: Field | null;
  isOpen: boolean;
  onClose: () => void;
  onReservationComplete?: (reservation: any) => void;
}

export function FieldReservationModal({ 
  field, 
  isOpen, 
  onClose, 
  onReservationComplete 
}: FieldReservationModalProps) {
  const [currentStep, setCurrentStep] = useState<'calendar' | 'details' | 'auth-required' | 'confirmation'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ start: string; end: string } | null>(null);
  const [bookingType, setBookingType] = useState<'hourly' | 'daily'>('hourly');
  const [availabilityData, setAvailabilityData] = useState<AvailabilityCheck[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<FieldBlackoutDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();

  // Form data for reservation details
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    organization: '',
    purpose: '',
    estimatedAttendees: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    specialRequests: '',
    agreedToTerms: false,
    agreedToLiability: false,
    insuranceCertificate: null as File | null,
    timeIn: '',
    timeOut: ''
  });

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (user && !userLoading) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name || '',
        contactEmail: user.email || '',
        contactPhone: user.phone || '',
        organization: (user.type === 'external' || user.type === 'vendor') ? user.company : ''
      }));
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (isOpen && field) {
      loadFieldData();
    }
  }, [isOpen, field]);

  useEffect(() => {
    if (field && reservations.length >= 0 && blackoutDates.length >= 0) {
      generateAvailabilityCalendar();
    }
  }, [field, reservations, blackoutDates, currentMonth]);

  // Auto-set time for daily bookings
  useEffect(() => {
    if (bookingType === 'daily' && selectedDate) {
      setSelectedTimeSlot({ start: '08:00', end: '18:00' });
      setFormData(prev => ({ ...prev, timeIn: '08:00', timeOut: '18:00' }));
    } else if (bookingType === 'hourly' && selectedDate) {
      setSelectedTimeSlot(null);
      setFormData(prev => ({ ...prev, timeIn: '', timeOut: '' }));
    }
  }, [bookingType, selectedDate]);

  const loadFieldData = async () => {
    if (!field) return;
    
    try {
      setIsLoading(true);
      
      // Mock data for demo - in real app, fetch from API
      const mockReservations: Reservation[] = [
        {
          id: 'res1',
          field_id: field.id,
          facility_id: field.facility_id,
          start_time: '2025-01-22T14:00:00Z',
          end_time: '2025-01-22T16:00:00Z',
          booking_type: 'hourly',
          renter_name: 'John Smith',
          renter_email: 'john@example.com',
          purpose_of_use: 'Soccer practice',
          total_amount: 100,
          discount_amount: 0,
          tax_amount: 8.5,
          deposit_amount: 25,
          status: 'confirmed',
          approval_required: false,
          payment_status: 'paid',
          paid_amount: 100,
          liability_waiver_signed: true,
          created_at: '2025-01-15T09:00:00Z',
          updated_at: '2025-01-15T09:00:00Z'
        }
      ];
      
      const mockBlackoutDates: FieldBlackoutDate[] = [
        {
          id: 'blackout1',
          field_id: field.id,
          start_date: '2025-01-25',
          end_date: '2025-01-27',
          reason: 'Maintenance work',
          recurring: false,
          created_at: '2025-01-15T09:00:00Z'
        },
        {
          id: 'blackout2',
          field_id: field.id,
          start_date: '2025-01-30',
          end_date: '2025-01-30',
          start_time: '18:00',
          end_time: '22:00',
          reason: 'Private event',
          recurring: false,
          created_at: '2025-01-15T09:00:00Z'
        }
      ];
      
      setReservations(mockReservations);
      setBlackoutDates(mockBlackoutDates);
      
    } catch (error) {
      console.error('Error loading field data:', error);
      toast({
        title: "Error loading data",
        description: "Unable to load field availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateAvailabilityCalendar = () => {
    if (!field) return;
    
    // Get first day of current month and last day
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Add padding days to fill the calendar grid
    const startOfWeek = new Date(firstDay);
    startOfWeek.setDate(firstDay.getDate() - firstDay.getDay());
    
    const endOfWeek = new Date(lastDay);
    endOfWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const startDateStr = startOfWeek.toISOString().split('T')[0];
    const endDateStr = endOfWeek.toISOString().split('T')[0];
    
    const availability = FieldAvailabilityService.checkDateRangeAvailability(
      field,
      startDateStr,
      endDateStr,
      reservations,
      blackoutDates
    );
    
    setAvailabilityData(availability);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    
    if (bookingType === 'daily') {
      // For daily bookings, automatically select full day
      setSelectedTimeSlot({ start: '08:00', end: '18:00' });
      setFormData(prev => ({ ...prev, timeIn: '08:00', timeOut: '18:00' }));
      setCurrentStep('details');
    } else {
      // For hourly bookings, show time input selection
      setFormData(prev => ({ ...prev, timeIn: '', timeOut: '' }));
      setCurrentStep('details');
    }
  };

  const handleTimeChange = (field: 'timeIn' | 'timeOut', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update selectedTimeSlot when both times are selected
    const timeIn = field === 'timeIn' ? value : formData.timeIn;
    const timeOut = field === 'timeOut' ? value : formData.timeOut;
    
    if (timeIn && timeOut) {
      setSelectedTimeSlot({ start: timeIn, end: timeOut });
    } else {
      setSelectedTimeSlot(null);
    }
  };

  const validateTimeRange = () => {
    if (!formData.timeIn || !formData.timeOut) return true; // Allow empty times
    
    const timeInMinutes = parseInt(formData.timeIn.split(':')[0]) * 60 + parseInt(formData.timeIn.split(':')[1]);
    const timeOutMinutes = parseInt(formData.timeOut.split(':')[0]) * 60 + parseInt(formData.timeOut.split(':')[1]);
    
    return timeOutMinutes > timeInMinutes;
  };

  const getAvailableTimeSlots = () => {
    if (!field || !selectedDate) return [];
    
    return FieldAvailabilityService.getAvailableTimeSlots(
      field,
      selectedDate,
      reservations,
      blackoutDates
    );
  };

  const calculateCost = () => {
    if (!field || !selectedTimeSlot) return { subtotal: 0, tax: 0, total: 0, deposit: 0 };
    
    const startHour = parseInt(selectedTimeSlot.start.split(':')[0]);
    const endHour = parseInt(selectedTimeSlot.end.split(':')[0]);
    const hours = endHour - startHour;
    
    const subtotal = bookingType === 'daily' ? field.daily_rate : field.hourly_rate * hours;
    const tax = subtotal * 0.085; // 8.5% tax
    const total = subtotal + tax;
    const deposit = total * 0.25; // 25% deposit
    
    return { subtotal, tax, total, deposit };
  };

  const handleReservationSubmit = async () => {
    if (!field || !selectedDate || !selectedTimeSlot) return;
    
    // Check if user is authenticated
    if (!user && !userLoading) {
      setCurrentStep('auth-required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Validate form
      const requiredFields = [
        'contactName', 'contactEmail', 'contactPhone', 'purpose', 
        'estimatedAttendees', 'emergencyContactName', 'emergencyContactPhone'
      ];
      
      const missingFields = requiredFields.filter(fieldName => 
        !formData[fieldName as keyof typeof formData]
      );
      
      if (missingFields.length > 0 || !formData.agreedToTerms || !formData.agreedToLiability || !formData.insuranceCertificate) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields, upload insurance certificate, and agree to the terms.",
          variant: "destructive",
        });
        return;
      }
      
      // Create reservation
      const startDateTime = new Date(`${selectedDate}T${selectedTimeSlot.start}:00`);
      const endDateTime = new Date(`${selectedDate}T${selectedTimeSlot.end}:00`);
      
      const reservationPayload: CreateReservationRequest = {
        field_id: field.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        booking_type: bookingType,
        renter_name: formData.contactName,
        renter_email: formData.contactEmail,
        renter_phone: formData.contactPhone || undefined,
        organization_name: formData.organization || undefined,
        purpose_of_use: formData.purpose,
        estimated_attendees: parseInt(formData.estimatedAttendees) || undefined,
        special_requests: formData.specialRequests || undefined,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone
      };
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reservation');
      }
      
      const result = await response.json();
      
      toast({
        title: "Reservation created successfully!",
        description: `Your reservation for ${field.name} has been submitted for approval.`,
      });
      
      setCurrentStep('confirmation');
      onReservationComplete?.(result.reservation);
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Reservation failed",
        description: error instanceof Error ? error.message : "Unable to create reservation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('calendar');
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setFormData({
      contactName: user?.name || '',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
      organization: (user?.type === 'external' || user?.type === 'vendor') ? user.company : '',
      purpose: '',
      estimatedAttendees: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      specialRequests: '',
      agreedToTerms: false,
      agreedToLiability: false,
      insuranceCertificate: null,
      timeIn: '',
      timeOut: ''
    });
  };

  const renderCalendarStep = () => (
    <div className="space-y-4">
      {/* Booking Type Selection */}
      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-card-foreground text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Booking Type
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBookingType('hourly')}
              className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                bookingType === 'hourly'
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'bg-background/50 border-border hover:border-primary/30 hover:bg-accent'
              }`}
            >
              <div className="font-medium text-sm">Hourly</div>
              <div className="text-xs opacity-70">${field?.hourly_rate}/hr</div>
            </button>
            <button
              onClick={() => setBookingType('daily')}
              className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                bookingType === 'daily'
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'bg-background/50 border-border hover:border-primary/30 hover:bg-accent'
              }`}
            >
              <div className="font-medium text-sm">Daily</div>
              <div className="text-xs opacity-70">${field?.daily_rate}/day</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Availability Calendar */}
      <Card className="bg-card/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-card-foreground text-base font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={handlePreviousMonth}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <h3 className="text-sm font-medium text-foreground">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="text-center text-xs font-medium text-muted-foreground/70 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {availabilityData.map((day, index) => {
              const date = new Date(day.date);
              const dayNumber = date.getDate();
              const isSelected = selectedDate === day.date;
              const isPast = new Date(day.date) < new Date();
              const isToday = new Date(day.date).toDateString() === new Date().toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => day.isAvailable && !isPast ? handleDateSelect(day.date) : null}
                  disabled={!day.isAvailable || isPast}
                  className={`
                    relative aspect-square flex items-center justify-center text-sm rounded-md transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : day.isAvailable && !isPast
                        ? 'bg-background/50 hover:bg-accent text-foreground hover:shadow-sm border border-transparent hover:border-primary/20'
                        : 'text-muted-foreground/50 cursor-not-allowed'
                    }
                    ${isToday && !isSelected ? 'ring-1 ring-primary/40' : ''}
                  `}
                >
                  <span className="relative z-10">{dayNumber}</span>
                  
                  {/* Status Indicator */}
                  {!day.isAvailable && !isPast && (
                    <div className={`absolute inset-0 rounded-md ${
                      day.conflictType === 'blackout' 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : day.conflictType === 'reservation'
                          ? 'bg-blue-500/10 border border-blue-500/20'
                          : 'bg-gray-500/10 border border-gray-500/20'
                    }`}>
                      <div className="absolute top-0.5 right-0.5">
                        {day.conflictType === 'blackout' ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        ) : day.conflictType === 'reservation' ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Available Indicator */}
                  {day.isAvailable && !isPast && !isSelected && (
                    <div className="absolute top-0.5 right-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/70" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Minimal Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Availability Info */}
      {selectedDate && (
        <Card className="bg-card/20 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="font-medium text-card-foreground text-sm">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click "Continue" to select time and complete your reservation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDetailsStep = () => {
    const timeSlots = bookingType === 'hourly' ? getAvailableTimeSlots() : [];
    const costs = calculateCost();

    return (
      <div className="space-y-6">
        {/* Selected Date Info */}
        <Card className="bg-card/30 border-border/50">
          <CardContent className="p-4">
            <h3 className="font-medium text-card-foreground text-sm mb-2">Reservation Details</h3>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {selectedTimeSlot && (
                <span className="ml-2">
                  • {selectedTimeSlot.start} - {selectedTimeSlot.end}
                </span>
              )}
              <span className="ml-2">• {bookingType === 'hourly' ? 'Hourly' : 'Daily'} booking</span>
            </div>
          </CardContent>
        </Card>

        {/* Time Selection for Hourly Bookings */}
        {bookingType === 'hourly' && (
          <Card className="bg-card/30 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-card-foreground text-base font-medium">Select Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeIn" className="text-muted-foreground text-sm">Time In *</Label>
                  <Input
                    id="timeIn"
                    type="time"
                    value={formData.timeIn}
                    onChange={(e) => handleTimeChange('timeIn', e.target.value)}
                    className="bg-input border-border text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="timeOut" className="text-muted-foreground text-sm">Time Out *</Label>
                  <Input
                    id="timeOut"
                    type="time"
                    value={formData.timeOut}
                    onChange={(e) => handleTimeChange('timeOut', e.target.value)}
                    className="bg-input border-border text-foreground mt-1"
                  />
                </div>
              </div>
              {!validateTimeRange() && (
                <div className="text-red-400 text-xs mt-2">
                  Time Out must be after Time In
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Full Day Selection for Daily Bookings */}
        {bookingType === 'daily' && (
          <Card className="bg-card/30 border-border/50">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Full Day Booking</span>
                <span className="ml-2">• 8:00 AM - 6:00 PM</span>
              </div>
              {selectedDate && (
                <div className="mt-2 text-xs text-primary">
                  ✓ Time automatically set for full day reservation
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cost Breakdown */}
        {selectedTimeSlot && (
          <Card className="bg-card/60 border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-card-foreground">${costs.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8.5%):</span>
                  <span className="text-card-foreground">${costs.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span className="text-card-foreground">Total:</span>
                  <span className="text-card-foreground">${costs.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Deposit Required:</span>
                  <span>${costs.deposit.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information Form */}
        <Card className="bg-card/60 border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName" className="text-muted-foreground">Full Name *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="contactEmail" className="text-muted-foreground">Email Address *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone" className="text-muted-foreground">Phone Number *</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label htmlFor="organization" className="text-muted-foreground">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Organization name (optional)"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="purpose" className="text-muted-foreground">Purpose of Use *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                className="bg-input border-border text-foreground"
                placeholder="Describe the purpose of your field reservation"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedAttendees" className="text-muted-foreground">Number of Attendees *</Label>
                <Input
                  id="estimatedAttendees"
                  type="number"
                  value={formData.estimatedAttendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedAttendees: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Expected number of people"
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactName" className="text-muted-foreground">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Emergency contact name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="emergencyContactPhone" className="text-muted-foreground">Emergency Contact Phone *</Label>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                className="bg-input border-border text-foreground"
                placeholder="Emergency contact phone number"
              />
            </div>
            
            <div>
              <Label htmlFor="insuranceCertificate" className="text-muted-foreground">Insurance Certificate *</Label>
              <Input
                id="insuranceCertificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFormData(prev => ({ ...prev, insuranceCertificate: e.target.files?.[0] || null }))}
                className="bg-input border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload a copy of your insurance certificate (PDF, JPG, PNG - Max 10MB)
              </p>
              {formData.insuranceCertificate && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {formData.insuranceCertificate.name}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="specialRequests" className="text-muted-foreground">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                className="bg-input border-border text-foreground"
                placeholder="Any special requests or requirements (optional)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card className="bg-card/60 border-border">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-medium text-sm text-foreground mb-3">Terms and Conditions</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  I agree to the <span className="text-primary underline cursor-pointer">terms and conditions</span> and <span className="text-primary underline cursor-pointer">cancellation policy</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.agreedToTerms ? 'default' : 'outline'}
                    className={formData.agreedToTerms ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, agreedToTerms: true }))}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!formData.agreedToTerms ? 'default' : 'outline'}
                    className={!formData.agreedToTerms ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, agreedToTerms: false }))}
                  >
                    No
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  I acknowledge and agree to the <span className="text-primary underline cursor-pointer">liability waiver</span> and hold harmless agreement
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.agreedToLiability ? 'default' : 'outline'}
                    className={formData.agreedToLiability ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, agreedToLiability: true }))}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!formData.agreedToLiability ? 'default' : 'outline'}
                    className={!formData.agreedToLiability ? 'bg-red-600 hover:bg-red-700' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, agreedToLiability: false }))}
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAuthRequiredStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center">
        <UserPlus className="h-10 w-10 text-primary" />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground">
          Sign In Required
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          To complete your reservation for <strong>{field?.name}</strong>, please create an account or sign in to your existing account.
        </p>
      </div>

      <div className="bg-card/30 border border-border/50 rounded-xl p-4 mx-auto max-w-sm">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">{selectedTimeSlot?.start} - {selectedTimeSlot?.end}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{bookingType}</span>
          </div>
          <div className="border-t border-border/50 pt-2 flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-primary">${calculateCost().total.toFixed(2)}</span>
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
          <Button variant="outline" className="w-full">
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Your reservation details will be saved when you return.
      </p>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-400" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-card-foreground mb-2">
          Reservation Submitted Successfully!
        </h3>
        <p className="text-muted-foreground">
          Your reservation for {field?.name} has been submitted and is pending approval.
          You will receive confirmation details via email and SMS.
        </p>
      </div>
      
      <Card className="bg-card/60 border-border">
        <CardContent className="p-4">
          <h4 className="font-medium text-card-foreground mb-2">Reservation Details</h4>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {selectedTimeSlot && (
                <span className="ml-2">• {selectedTimeSlot.start} - {selectedTimeSlot.end}</span>
              )}
            </div>
            <div>Field: {field?.name}</div>
            <div>Total Cost: ${calculateCost().total.toFixed(2)}</div>
            <div>Deposit Required: ${calculateCost().deposit.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground">
        Payment instructions will be sent separately once your reservation is approved.
      </p>
    </div>
  );

  if (!field) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Reserve {field.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!isLoading && (
          <>
            {currentStep === 'calendar' && renderCalendarStep()}
            {currentStep === 'details' && renderDetailsStep()}
            {currentStep === 'auth-required' && renderAuthRequiredStep()}
            {currentStep === 'confirmation' && renderConfirmationStep()}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t border-border">
              <div>
                {currentStep !== 'calendar' && currentStep !== 'confirmation' && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('calendar')}
                    className="border-border text-muted-foreground hover:bg-accent"
                  >
                    Back to Calendar
                  </Button>
                )}
              </div>
              
              <div className="flex gap-3">
                {currentStep === 'confirmation' ? (
                  <Button
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Close
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="border-border text-muted-foreground hover:bg-accent"
                    >
                      Cancel
                    </Button>
                    {currentStep === 'calendar' && selectedDate && (
                      <Button
                        onClick={() => setCurrentStep('details')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Continue
                      </Button>
                    )}
                    {currentStep === 'details' && selectedTimeSlot && (
                      <Button
                        onClick={handleReservationSubmit}
                        disabled={!formData.agreedToTerms || !formData.agreedToLiability || !formData.insuranceCertificate || !validateTimeRange()}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Submit Reservation
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 