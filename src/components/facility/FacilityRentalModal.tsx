'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin,
  Calendar as CalendarIcon,
  Share2,
  Star,
  ChevronLeft,
  ChevronRight,
  Info,
  DollarSign,
  X,
  ShoppingCart,
  Plus,
  Trash2,
  Clock,
  Repeat,
  UserPlus,
  LogIn,
  Shield,
  CheckCircle
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, isSameDay } from 'date-fns';
import { Field, FieldBlackoutDate } from '@/types/field';
import { Room } from '@/types/building';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { createFieldReservationFromCart } from '@/app/actions/fields';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FacilityRentalModalProps {
  item: Field | Room | null;
  itemType: 'field' | 'room';
  isOpen: boolean;
  onClose: () => void;
  facilityName?: string;
  buildingName?: string;
  onReserve?: (item: Field | Room, reservationData: any) => void;
  fieldBlockouts?: FieldBlackoutDate[];
}

interface CartItem {
  id: string;
  item: Field | Room;
  itemType: 'field' | 'room';
  date: Date;
  timeSlot: string;
  duration: number;
  hourlyRate: number;
  subtotal: number;
  tax: number;
  total: number;
  recurring?: {
    type: 'weekly' | 'monthly' | 'yearly';
    occurrences: number;
    totalCost: number;
  };
}

interface TimeSlotAvailability {
  slot: string;
  available: boolean;
  booked?: boolean;
}

// Mock existing reservations to show unavailable times
const getExistingReservations = () => {
  const today = new Date();
  return [
    { date: format(today, 'yyyy-MM-dd'), timeSlot: '2:00 PM', duration: 2 },
    { date: format(addDays(today, 1), 'yyyy-MM-dd'), timeSlot: '10:00 AM', duration: 3 },
    { date: format(addDays(today, 2), 'yyyy-MM-dd'), timeSlot: '4:00 PM', duration: 2 },
  ];
};

const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
];

export function FacilityRentalModal({ 
  item, 
  itemType, 
  isOpen, 
  onClose, 
  facilityName,
  buildingName,
  onReserve,
  fieldBlockouts = []
}: FacilityRentalModalProps) {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlotAvailability[]>([]);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Pre-fill reservation data with user info
  const [reservationData, setReservationData] = useState({
    date: new Date(),
    timeSlot: '',
    duration: 2,
    recurring: 'none' as 'none' | 'weekly' | 'monthly' | 'yearly',
    recurringOccurrences: 1,
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: user?.phone || '',
    organization: user?.type === 'external' ? user.company : ''
  });
  
  // Checkout form data
  const [checkoutData, setCheckoutData] = useState({
    eventPurpose: '',
    setupNeeds: '',
    tablesNeeded: 0,
    chairsNeeded: 0,
    hvacNeeded: '',
    // Policy acknowledgments - changed from boolean to string for Yes/No buttons
    cancellationPolicy: 'no' as 'yes' | 'no',
    employeeRequirement: 'no' as 'yes' | 'no',
    insuranceRequirement: 'no' as 'yes' | 'no',
    insuranceFeePolicy: 'no' as 'yes' | 'no',
    priorityPolicy: 'no' as 'yes' | 'no',
    paymentPolicy: 'no' as 'yes' | 'no',
    portaPottyPolicy: 'no' as 'yes' | 'no',
    portaPottyCoordination: 'no' as 'yes' | 'no',
    securityPolicy: 'no' as 'yes' | 'no',
    securityContract: 'no' as 'yes' | 'no',
    largeEquipment: 'no' as 'yes' | 'no'
  });

  // Mock images for gallery
  const images = (item && 'gallery_images' in item && item.gallery_images && Array.isArray(item.gallery_images) && item.gallery_images.length > 0) 
    ? item.gallery_images 
    : [
        '/images/placeholder.jpg',
        '/images/placeholder 2.jpg',
        '/images/placeholder.jpg'
      ];

  const existingReservations = getExistingReservations();

  // Check if a date has any available time slots
  const hasAvailableSlots = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const reservationsForDate = existingReservations.filter(r => r.date === dateStr);
    
    // If no reservations, all slots are available
    if (reservationsForDate.length === 0) return true;
    
    // Check if all slots are booked
    const bookedSlots = reservationsForDate.flatMap(r => {
      const startIndex = timeSlots.findIndex(slot => slot === r.timeSlot);
      return Array.from({ length: r.duration }, (_, i) => startIndex + i);
    });
    
    return bookedSlots.length < timeSlots.length;
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = (date: Date): TimeSlotAvailability[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const reservationsForDate = existingReservations.filter(r => r.date === dateStr);
    
    const bookedSlots = new Set();
    reservationsForDate.forEach(r => {
      const startIndex = timeSlots.findIndex(slot => slot === r.timeSlot);
      for (let i = 0; i < r.duration; i++) {
        bookedSlots.add(startIndex + i);
      }
    });

    return timeSlots.map((slot, index) => ({
      slot,
      available: !bookedSlots.has(index),
      booked: bookedSlots.has(index)
    }));
  };

  // Check if consecutive slots are available for duration
  const isSlotAvailable = (startSlot: string, duration: number, availableSlots: TimeSlotAvailability[]) => {
    const startIndex = timeSlots.findIndex(slot => slot === startSlot);
    if (startIndex === -1 || startIndex + duration > timeSlots.length) return false;
    
    for (let i = 0; i < duration; i++) {
      const slotIndex = startIndex + i;
      if (!availableSlots[slotIndex]?.available) return false;
    }
    return true;
  };

  // Update available time slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const slots = getAvailableTimeSlots(selectedDate);
      setAvailableTimeSlots(slots);
    }
  }, [selectedDate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
      // Check if there's a pending reservation in localStorage
      const pendingReservation = localStorage.getItem('pendingFieldDetailReservation');
      if (pendingReservation) {
        try {
          const reservationData = JSON.parse(pendingReservation);
          console.log('Found pending reservation, auto-submitting...', reservationData);
          
          // Clear the pending reservation
          localStorage.removeItem('pendingFieldDetailReservation');
          
          // Restore the cart and checkout data
          if (reservationData.cart) {
            setCart(reservationData.cart);
          }
          if (reservationData.checkoutData) {
            setCheckoutData(reservationData.checkoutData);
          }
          
          // Auto-submit the reservation
          setIsSubmittingReservation(true);
          submitReservationToDatabase(reservationData);
        } catch (error) {
          console.error('Error processing pending reservation:', error);
        }
      }
    }
  }, [user, userLoading]);

  if (!item || !isOpen) return null;

  const isField = itemType === 'field';
  const field = isField ? item as Field : null;
  const room = !isField ? item as Room : null;

  const itemName = isField ? field?.name : room?.room_number + ' - ' + room?.room_function;
  const hourlyRate = isField ? field?.hourly_rate : 50;
  const capacity = isField ? field?.capacity : room?.capacity;

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) return true;
    
    // Check if date falls within any blockout period
    if (fieldBlockouts && fieldBlockouts.length > 0) {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Debug logging
      if (dateStr === '2025-07-09' || dateStr === '2025-07-10') {
        console.log('Checking date:', dateStr);
        console.log('Field blockouts:', fieldBlockouts);
      }
      
      const isBlocked = fieldBlockouts.some(blockout => {
        const blocked = blockout.start_date <= dateStr && blockout.end_date >= dateStr;
        
        // Debug specific dates
        if (dateStr === '2025-07-09' || dateStr === '2025-07-10') {
          console.log(`Blockout ${blockout.start_date} to ${blockout.end_date}: ${blocked}`);
        }
        
        return blocked;
      });
      
      if (isBlocked) return true;
    }
    
    return false;
  };

  const isDateFullyBooked = (date: Date) => {
    return !isDateDisabled(date) && !hasAvailableSlots(date);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isDateDisabled(date)) {
      setSelectedDate(date);
      setShowBookingForm(true);
    }
  };

  const addToCart = () => {
    if (!selectedDate || !reservationData.timeSlot || !item) return;

    const subtotal = (hourlyRate || 0) * reservationData.duration;
    const tax = subtotal * 0.085;
    const total = subtotal + tax;

    let recurring = undefined;
    let recurringTotalCost = total;

    if (reservationData.recurring !== 'none' && reservationData.recurringOccurrences > 1) {
      recurringTotalCost = total * reservationData.recurringOccurrences;
      recurring = {
        type: reservationData.recurring,
        occurrences: reservationData.recurringOccurrences,
        totalCost: recurringTotalCost
      };
    }

    const cartItem: CartItem = {
      id: `${format(selectedDate, 'yyyy-MM-dd')}-${reservationData.timeSlot}-${Date.now()}`,
      item,
      itemType,
      date: selectedDate,
      timeSlot: reservationData.timeSlot,
      duration: reservationData.duration,
      hourlyRate: hourlyRate || 0,
      subtotal,
      tax,
      total,
      recurring
    };

    setCart(prev => [...prev, cartItem]);
    
    // Reset form
    setReservationData(prev => ({
      ...prev,
      timeSlot: '',
      duration: 1,
      recurring: 'none',
      recurringOccurrences: 1
    }));
    setSelectedDate(undefined);
    setShowBookingForm(false);
    setShowCart(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => {
    if (item.recurring) {
      return sum + item.recurring.totalCost;
    }
    return sum + item.total;
  }, 0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const submitReservationToDatabase = async (reservationData: any) => {
    try {
      // Create reservation data for fields only (as rooms are not implemented yet)
      if (itemType === 'field') {
        console.log('Submitting field reservation:', reservationData);
        
        const result = await createFieldReservationFromCart(reservationData);
        
        if (result.success) {
          // Calculate total from the reservation data
          const total = reservationData.cart.reduce((sum: number, item: any) => sum + item.total, 0);
          
          // Close the modal and show success
          onClose();
          
          // Clear cart and reset forms
          setCart([]);
          setCheckoutData({
            eventPurpose: '',
            setupNeeds: '',
            tablesNeeded: 0,
            chairsNeeded: 0,
            hvacNeeded: '',
            cancellationPolicy: 'no' as 'yes' | 'no',
            employeeRequirement: 'no' as 'yes' | 'no',
            insuranceRequirement: 'no' as 'yes' | 'no',
            insuranceFeePolicy: 'no' as 'yes' | 'no',
            priorityPolicy: 'no' as 'yes' | 'no',
            paymentPolicy: 'no' as 'yes' | 'no',
            portaPottyPolicy: 'no' as 'yes' | 'no',
            portaPottyCoordination: 'no' as 'yes' | 'no',
            securityPolicy: 'no' as 'yes' | 'no',
            securityContract: 'no' as 'yes' | 'no',
            largeEquipment: 'no' as 'yes' | 'no'
          });

          // Show success toast
          toast({
            title: '🎉 Reservation Created Successfully!',
            description: `Your reservation has been created and sent for approval. Total: $${total.toFixed(2)}`,
          });

          // Redirect to user dashboard after a brief delay
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/user-dashboard';
            }, 2000);
          }
        } else {
          throw new Error(result.error || 'Failed to create reservation');
        }
      } else {
        // For rooms, show a message that it's not implemented yet
        toast({
          title: 'Coming Soon',
          description: 'Room reservations are not available yet. Please check back later.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: 'Reservation Failed',
        description: error instanceof Error ? error.message : 'There was an error creating your reservation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const handleSubmitReservation = async () => {
    // First, validate the form fields and policies
    const requiredPolicies = {
      cancellationPolicy: "I understand the District's Cancellation Procedures",
      employeeRequirement: "I understand that a District employee must be on duty",
      insuranceRequirement: "I understand the District's Insurance Requirements",
      insuranceFeePolicy: "I understand the additional insurance fee policy",
      priorityPolicy: "I understand that school-related activities have priority",
      paymentPolicy: "I understand that I must pay all fees prior to my event",
      portaPottyPolicy: "I understand that porta potty service is at my expense",
      portaPottyCoordination: "I must coordinate porta potty placement",
      securityPolicy: "I understand that security is at my expense",
    };

    const unacknowledgedPolicies = Object.entries(requiredPolicies)
      .filter(([key, _]) => checkoutData[key as keyof typeof requiredPolicies] !== 'yes')
      .map(([_, description]) => description);

    if (unacknowledgedPolicies.length > 0) {
      toast({
        title: 'Policy Acknowledgment Required',
        description: `Please acknowledge the following policies: \n- ${unacknowledgedPolicies.join('\n- ')}`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!checkoutData.eventPurpose || !checkoutData.hvacNeeded) {
      toast({
        title: 'Missing Information',
        description: 'Please provide the event purpose and HVAC needs.',
        variant: 'destructive',
      });
      return;
    }

    // If validation passes, check for authentication
    if (userLoading) {
      toast({
        title: 'Verifying user...',
        description: 'Please wait while we check your authentication status.',
      });
      return;
    }
    
    if (!user) {
      console.log('User not authenticated, showing auth modal');
      
      const submissionData = {
        cart: cart.map(item => ({ ...item, item: item.item as Field })),
        checkoutData,
        contactInfo: {
          name: reservationData.contactName || '',
          email: reservationData.contactEmail || '',
          phone: reservationData.contactPhone || '',
          organization: reservationData.organization || ''
        }
      };

      // Store the reservation data in localStorage
      localStorage.setItem('pendingFieldDetailReservation', JSON.stringify(submissionData));
      
      // Show auth modal
      setShowAuthModal(true);
      
      // Auto-navigate to sign-up page after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/sign-up';
        }
      }, 2500); // Show modal for 2.5 seconds before redirecting
      
      return;
    }

    if (!user) {
      console.error('No user found during submission, this should not happen if logic is correct.');
      toast({
        title: 'Authentication Error',
        description: 'Could not find user session. Please try signing in again.',
        variant: 'destructive',
      });
      return;
    }

    // If authenticated, submit directly
    setIsSubmittingReservation(true);
    
    const submissionData = {
      cart: cart.map(item => ({ ...item, item: item.item as Field })),
      checkoutData,
      contactInfo: {
        name: reservationData.contactName || user.name || '',
        email: reservationData.contactEmail || user.email || '',
        phone: reservationData.contactPhone || user.phone || '',
        organization: reservationData.organization || (user.type === 'external' ? user.company : '') || ''
      }
    };
    
    await submitReservationToDatabase(submissionData);
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-50 bg-white">
        {/* Loading Overlay when auto-submitting */}
        {isSubmittingReservation && (
          <div className="absolute inset-0 z-60 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Submitting Your Reservation...</h3>
                <p className="text-sm text-gray-600 mt-2">Please wait while we process your booking request.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="h-full w-full flex flex-col">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-full opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white p-2 shadow-md hover:shadow-lg"
            disabled={isSubmittingReservation}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>

          {/* Header */}
          <div className="px-8 py-4 border-b bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-normal text-gray-900">
                  {isField ? 'Field' : 'Room'} - {itemName}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-gray-600">
                  <span className="text-lg">🏫</span>
                  <a href="#" className="text-blue-600 hover:underline">{facilityName}</a>
                  <span className="text-gray-400">|</span>
                  <MapPin className="h-4 w-4" />
                  <span>1839 Echo Avenue, Fresno, CA 93704</span>
                  <a href="#" className="text-blue-600 hover:underline ml-2">See on map</a>
                </div>
              </div>
              <div className="flex items-center gap-3 mr-12">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Star className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCart(!showCart)}
                  className="relative"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                  {cart.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cart.length}
                    </Badge>
                  )}
                </Button>
                <Button 
                  size="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  onClick={() => setShowBookingForm(true)}
                >
                  Check availability
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content - This is the scrollable area */}
          <div className="flex-1 overflow-y-auto">
            {showCheckout ? (
              // Checkout Form
              <div className="px-8 py-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowCheckout(false)}
                      className="text-gray-600"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back to Cart
                    </Button>
                    <h2 className="text-xl font-semibold">Complete Your Reservation</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2">
                      <Card className="border-gray-200">
                        <CardContent className="p-6 space-y-6">
                          {/* Event Details */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Event Details</h3>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="text-gray-700">Please briefly describe the purpose of your event *</Label>
                                <Textarea
                                  className="mt-2"
                                  rows={3}
                                  placeholder="Enter your event purpose..."
                                  value={checkoutData.eventPurpose}
                                  onChange={(e) => setCheckoutData(prev => ({ ...prev, eventPurpose: e.target.value }))}
                                />
                              </div>

                              <div>
                                <Label className="text-gray-700">Please describe your room set up needs</Label>
                                <Textarea
                                  className="mt-2"
                                  rows={3}
                                  placeholder="Describe your setup requirements..."
                                  value={checkoutData.setupNeeds}
                                  onChange={(e) => setCheckoutData(prev => ({ ...prev, setupNeeds: e.target.value }))}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-gray-700">How many tables will you need? (0, if not applicable)</Label>
                                  <Input
                                    className="mt-2"
                                    type="number"
                                    min="0"
                                    value={checkoutData.tablesNeeded}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, tablesNeeded: parseInt(e.target.value) || 0 }))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700">How many chairs will you need? (0, if not applicable)</Label>
                                  <Input
                                    className="mt-2"
                                    type="number"
                                    min="0"
                                    value={checkoutData.chairsNeeded}
                                    onChange={(e) => setCheckoutData(prev => ({ ...prev, chairsNeeded: parseInt(e.target.value) || 0 }))}
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-gray-700">Will HVAC be needed for your event? *</Label>
                                <div className="mt-2 space-y-2">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="hvac"
                                      value="yes"
                                      checked={checkoutData.hvacNeeded === 'yes'}
                                      onChange={(e) => setCheckoutData(prev => ({ ...prev, hvacNeeded: e.target.value }))}
                                      className="mr-2"
                                    />
                                    Yes
                                  </label>
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      name="hvac"
                                      value="no"
                                      checked={checkoutData.hvacNeeded === 'no'}
                                      onChange={(e) => setCheckoutData(prev => ({ ...prev, hvacNeeded: e.target.value }))}
                                      className="mr-2"
                                    />
                                    No
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Policy Acknowledgments */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Policy Acknowledgments</h3>
                            
                            <div className="space-y-4">
                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I understand the District's Cancellation Procedures: Renters can cancel without penalty up to 3 days prior to their event date. If canceled within the 3-day window, renters will be required to pay $50 (cancellation fee), plus any District expenses.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.cancellationPolicy === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.cancellationPolicy === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, cancellationPolicy: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.cancellationPolicy === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.cancellationPolicy === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, cancellationPolicy: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I understand that a District employee must be on duty whenever a school facility is utilized. Personnel will be paid on an overtime basis beyond regular hours.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.employeeRequirement === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.employeeRequirement === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, employeeRequirement: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.employeeRequirement === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.employeeRequirement === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, employeeRequirement: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I understand the District's Insurance Requirements: Commercial General Liability policy with limits of not less than $1,000,000 per occurrence, $2,000,000 annual aggregate limit. The District shall be named as additional insured.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.insuranceRequirement === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.insuranceRequirement === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, insuranceRequirement: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.insuranceRequirement === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.insuranceRequirement === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, insuranceRequirement: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I understand that if my reservation is missing insurance 5 days prior to my event start date, an additional $25/day will be added to my reservation to cover the cost of District insurance.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.insuranceFeePolicy === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.insuranceFeePolicy === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, insuranceFeePolicy: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.insuranceFeePolicy === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.insuranceFeePolicy === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, insuranceFeePolicy: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I understand that school-related activities shall be given priority in the use of facilities. Thereafter, use shall be on a first-come, first-served basis.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.priorityPolicy === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.priorityPolicy === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, priorityPolicy: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.priorityPolicy === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.priorityPolicy === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, priorityPolicy: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I understand that I must pay all facilities use fees and other costs incurred. Payment is due no fewer than 3 days prior to my event date.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.paymentPolicy === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.paymentPolicy === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, paymentPolicy: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.paymentPolicy === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.paymentPolicy === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, paymentPolicy: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  Renter understands that porta potty service is at the expense and set up of the renter/organization.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.portaPottyPolicy === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.portaPottyPolicy === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, portaPottyPolicy: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.portaPottyPolicy === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.portaPottyPolicy === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, portaPottyPolicy: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  Renter must coordinate with the site admin for placement of the porta potty location.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.portaPottyCoordination === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.portaPottyCoordination === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, portaPottyCoordination: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.portaPottyCoordination === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.portaPottyCoordination === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, portaPottyCoordination: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  Renter understands that if security is required it is at the expense and coordination of the renter/organization.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.securityPolicy === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.securityPolicy === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, securityPolicy: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.securityPolicy === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.securityPolicy === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, securityPolicy: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  I plan to bring large equipment or vehicle(s) onto District property for my event (food truck, etc.). Note: Additional insurance requirements apply.
                                </p>
                                <div className="flex items-center gap-3">
                                  <Button
                                    type="button"
                                    variant={checkoutData.largeEquipment === 'yes' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.largeEquipment === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, largeEquipment: 'yes' }))}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={checkoutData.largeEquipment === 'no' ? 'default' : 'outline'}
                                    size="sm"
                                    className={checkoutData.largeEquipment === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
                                    onClick={() => setCheckoutData(prev => ({ ...prev, largeEquipment: 'no' }))}
                                  >
                                    No
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="text-sm">
                                  <p className="font-medium text-blue-900">Secure Payment Processing</p>
                                  <p className="text-blue-700 mt-1">
                                    You will be redirected to our secure payment portal to complete your booking.
                                    We accept all major credit cards, debit cards, and ACH transfers.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>SSL encrypted payment processing</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>PCI compliant security standards</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Instant confirmation upon payment</span>
                              </div>
                            </div>

                            {/* TODO: Stripe Integration
                                To complete the Stripe integration:
                                1. Install Stripe packages: npm install stripe @stripe/stripe-js @stripe/react-stripe-js
                                2. Set up Stripe keys in .env.local:
                                   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                                   - STRIPE_SECRET_KEY
                                3. Create API route for payment intent creation
                                4. Implement Stripe Elements for card input
                                5. Handle payment confirmation and webhook events
                            */}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                      <Card className="border-gray-200 sticky top-6">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                          
                          <div className="space-y-3 mb-4">
                            {cart.map((cartItem, index) => (
                              <div key={cartItem.id} className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {cartItem.itemType === 'field' ? 
                                    (cartItem.item as Field).name : 
                                    `${(cartItem.item as Room).room_number} - ${(cartItem.item as Room).room_function}`
                                  }
                                </div>
                                <div className="text-gray-600">
                                  {format(cartItem.date, 'MMM d, yyyy')} • {cartItem.timeSlot} ({cartItem.duration}h)
                                  {cartItem.recurring && (
                                    <span className="ml-2 text-blue-600">
                                      <Repeat className="h-3 w-3 inline mr-1" />
                                      {cartItem.recurring.type} x{cartItem.recurring.occurrences}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right font-medium">
                                  ${cartItem.recurring ? cartItem.recurring.totalCost.toFixed(2) : cartItem.total.toFixed(2)}
                                </div>
                                {index < cart.length - 1 && <hr className="mt-3" />}
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-4 mb-6">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">Total</span>
                              <span className="text-xl font-bold">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {cart.length} booking{cart.length > 1 ? 's' : ''}
                            </div>
                          </div>

                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                            size="lg"
                            disabled={
                              !checkoutData.eventPurpose ||
                              !checkoutData.hvacNeeded ||
                              checkoutData.cancellationPolicy !== 'yes' ||
                              checkoutData.employeeRequirement !== 'yes' ||
                              checkoutData.insuranceRequirement !== 'yes' ||
                              checkoutData.insuranceFeePolicy !== 'yes' ||
                              checkoutData.priorityPolicy !== 'yes' ||
                              checkoutData.paymentPolicy !== 'yes' ||
                              checkoutData.portaPottyPolicy !== 'yes' ||
                              checkoutData.portaPottyCoordination !== 'yes' ||
                              checkoutData.securityPolicy !== 'yes'
                            }
                            onClick={handleSubmitReservation}
                          >
                            {isSubmittingReservation || userLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                              </>
                            ) : (
                              'Submit Reservation Request'
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            ) : showCart ? (
              // Cart View
              <div className="px-8 py-6">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowCart(false)}
                      className="text-gray-600"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <h2 className="text-xl font-semibold">Shopping Cart ({cart.length} items)</h2>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                      <p className="text-gray-600 mb-4">Add some bookings to get started</p>
                      <Button onClick={() => setShowCart(false)}>
                        Browse Facilities
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((cartItem) => (
                        <Card key={cartItem.id} className="border-gray-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                  {cartItem.itemType === 'field' ? 
                                    (cartItem.item as Field).name : 
                                    `${(cartItem.item as Room).room_number} - ${(cartItem.item as Room).room_function}`
                                  }
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4" />
                                    {format(cartItem.date, 'EEEE, MMMM d, yyyy')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {cartItem.timeSlot} ({cartItem.duration}h)
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600">
                                  ${cartItem.hourlyRate}/hour × {cartItem.duration} hours
                                  {cartItem.recurring && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-700">
                                      <Repeat className="h-3 w-3 mr-1" />
                                      {cartItem.recurring.type} × {cartItem.recurring.occurrences}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-medium">
                                    ${cartItem.recurring ? cartItem.recurring.totalCost.toFixed(2) : cartItem.total.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {cartItem.recurring ? (
                                      <span>${cartItem.total.toFixed(2)} × {cartItem.recurring.occurrences}</span>
                                    ) : (
                                      <span>${cartItem.subtotal.toFixed(2)} + ${cartItem.tax.toFixed(2)} tax</span>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(cartItem.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Cart Summary */}
                      <Card className="border-gray-200 bg-gray-50">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Order Summary</h3>
                            <div className="text-right">
                              <div className="text-2xl font-bold">${cartTotal.toFixed(2)}</div>
                              <div className="text-sm text-gray-600">{cart.length} booking{cart.length > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                            size="lg"
                            onClick={() => {
                              // Debug authentication state
                              console.log('Proceed to Checkout clicked - Auth Debug:', {
                                user: user,
                                userLoading: userLoading,
                                userExists: !!user,
                                shouldShowAuth: !user && !userLoading
                              });
                              
                              // Check if user is authenticated before proceeding to checkout
                              if (!user && !userLoading) {
                                console.log('User not authenticated, showing auth modal');
                                setShowAuthModal(true);
                              } else {
                                console.log('User authenticated, proceeding to checkout');
                                setShowCheckout(true);
                              }
                            }}
                          >
                            Proceed to Checkout
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            ) : !showBookingForm ? (
              <div>
                {/* Image Gallery Section with Navigation - Fixed height container */}
                <div className="bg-gray-50 border-b" style={{ minHeight: '400px' }}>
                  <div className="px-8 py-6 h-full">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <img src={images[currentImageIndex]} alt={`${itemName} - ${currentImageIndex + 1}`} className="w-full h-auto rounded-lg" />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <img src={images[(currentImageIndex + 1) % images.length]} alt={`${itemName} - ${((currentImageIndex + 1) % images.length) + 1}`} className="w-full h-auto rounded-lg" />
                        <img src={images[(currentImageIndex + 2) % images.length]} alt={`${itemName} - ${((currentImageIndex + 2) % images.length) + 1}`} className="w-full h-auto rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area - Starts after images with relative positioning */}
                <div className="bg-white relative">
                  <div className="px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                      {/* Left Column - About this facility - Takes 2/5 of space */}
                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold mb-4">About this facility</h2>
                          
                          {/* Description */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-gray-500">📝</span>
                              <span className="font-medium">Description</span>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                              The {isField ? 'Football field' : room?.room_function} is available for any sport, including football, lacrosse, soccer, cheerleading, and many additional uses. This facility features professional-grade artificial turf, regulation field markings, and spectator seating. The field is suitable for football, soccer, lacrosse, field hockey, and various other recreational activities. It includes modern amenities and safety features to ensure a premium experience for all users.
                            </p>
                            <button className="text-blue-600 hover:underline text-sm mt-2">Show more</button>
                          </div>

                          {/* Rates */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-gray-500">💲</span>
                              <span className="font-medium">Rates</span>
                            </div>
                            <p className="text-gray-600">
                              ${hourlyRate}/hour - Contact us for daily and weekly rates
                            </p>
                          </div>

                          {/* Features */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-gray-500">⭐</span>
                              <span className="font-medium">Features</span>
                            </div>
                            <div className="space-y-2">
                              <div className="text-gray-600">• Professional artificial turf surface</div>
                              <div className="text-gray-600">• Stadium lighting for evening events</div>
                              <div className="text-gray-600">• Spectator seating for 500 people</div>
                              <div className="text-gray-600">• Parking available on-site</div>
                              <div className="text-gray-600">• Restroom facilities</div>
                              <div className="text-gray-600">• Equipment storage available</div>
                            </div>
                          </div>
                        </div>

                        {/* Offered with the facility */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            Offered with the facility
                            <span className="text-blue-500 text-sm font-normal flex items-center gap-1">
                              <Info className="h-4 w-4" />
                              Additional fees may apply
                            </span>
                          </h3>
                          
                          <div className="space-y-3">
                            <div className="text-gray-700">General</div>
                            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                              <div>• Sound system rental</div>
                              <div>• Equipment rental</div>
                              <div>• Event setup assistance</div>
                              <div>• Security services</div>
                              <div>• Catering coordination</div>
                              <div>• Photography services</div>
                            </div>
                          </div>
                        </div>

                        {/* Possible Uses */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Possible uses</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">🎓</span>
                              <span className="font-medium">Education</span>
                              <span className="text-gray-600">Class</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">💪</span>
                              <span className="font-medium">Fitness</span>
                              <span className="text-gray-600">Exercise Class</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">🏃</span>
                              <span className="font-medium">General</span>
                              <span className="text-gray-600">Meeting, class, etc.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Calendar - Takes 3/5 of space */}
                      <div className="lg:col-span-3 space-y-6">
                        <div className="mt-4">
                          <h2 className="text-lg font-semibold">Select your date below</h2>
                          <div className="border rounded-lg p-4">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={isDateDisabled}
                              className="w-full"
                              classNames={{
                                months: "space-y-4",
                                month: "space-y-4",
                                caption: "flex justify-center relative items-center h-10",
                                caption_label: "text-base font-medium",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse",
                                head_row: "flex",
                                head_cell: "text-gray-500 font-normal text-sm w-9 text-center",
                                row: "flex w-full mt-2",
                                cell: "relative p-0 text-center text-sm w-9 h-9",
                                day: "h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-full",
                                day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                                day_today: "bg-gray-100",
                                day_outside: "text-gray-300",
                                day_disabled: "text-gray-300 line-through",
                                day_hidden: "invisible",
                              }}
                              modifiers={{
                                fullyBooked: (date: Date) => isDateFullyBooked(date),
                                hasAvailable: (date: Date) => hasAvailableSlots(date) && !isDateDisabled(date)
                              }}
                              modifiersClassNames={{
                                fullyBooked: 'text-red-500',
                                hasAvailable: 'text-green-600'
                              }}
                            />
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <span>Fully Booked</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                  <span>Unavailable</span>
                                </div>
                              </div>
                              <p className="text-sm text-center">
                                The earliest available date is{' '}
                                <span className="text-blue-600 font-medium">
                                  {format(addDays(new Date(), 1), 'MM/dd/yyyy')}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Availability Notice */}
                        <div className="w-full max-w-sm ml-auto">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 mb-2">Booking Information</h4>
                            <div className="text-sm text-blue-800 space-y-1">
                              <div>• Bookings require 48-hour advance notice</div>
                              <div>• Weekend bookings fill up quickly</div>
                              <div>• Contact us for recurring reservations</div>
                              <div>• Group discounts available for 10+ bookings</div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="w-full max-w-sm ml-auto">
                          <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>📞 Phone: (559) 555-0123</div>
                              <div>📧 Email: bookings@facility.com</div>
                              <div>🕒 Hours: Mon-Fri 8AM-6PM</div>
                              <div>📍 Address: 1839 Echo Avenue, Fresno, CA 93704</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Booking Form
              <div className="px-8 py-6">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowBookingForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                    <h2 className="text-xl font-semibold text-foreground">Add to cart</h2>
                  </div>

                  <Card className="border-border">
                    <CardContent className="p-6 space-y-6">
                      {/* Date and Time Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground">Date</Label>
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                          </div>
                        </div>
                        <div>
                          <Label className="text-foreground">Time</Label>
                          <Select 
                            value={reservationData.timeSlot}
                            onValueChange={(value) => setReservationData(prev => ({ ...prev, timeSlot: value }))}
                          >
                            <SelectTrigger className="mt-2 bg-background border-border text-foreground">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {availableTimeSlots.map((slot) => (
                                <SelectItem 
                                  key={slot.slot} 
                                  value={slot.slot}
                                  disabled={!isSlotAvailable(slot.slot, reservationData.duration, availableTimeSlots)}
                                  className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{slot.slot}</span>
                                    {!slot.available && <span className="text-destructive text-xs">(Booked)</span>}
                                    {!isSlotAvailable(slot.slot, reservationData.duration, availableTimeSlots) && slot.available && (
                                      <span className="text-warning text-xs">(Insufficient time)</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Duration */}
                      <div>
                        <Label className="text-foreground">Duration</Label>
                        <Select 
                          value={reservationData.duration.toString()}
                          onValueChange={(value) => setReservationData(prev => ({ ...prev, duration: parseInt(value) }))}
                        >
                          <SelectTrigger className="mt-2 bg-background border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                              <SelectItem key={hours} value={hours.toString()} className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                                {hours} hour{hours > 1 ? 's' : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Recurring Options */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-foreground">
                            <Repeat className="h-4 w-4 inline mr-1" />
                            Repeat
                          </Label>
                          <Select 
                            value={reservationData.recurring}
                            onValueChange={(value: 'none' | 'weekly' | 'monthly' | 'yearly') => setReservationData(prev => ({ ...prev, recurring: value }))}
                          >
                            <SelectTrigger className="mt-2 bg-background border-border text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              <SelectItem value="none" className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">No Repeat</SelectItem>
                              <SelectItem value="weekly" className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">Weekly</SelectItem>
                              <SelectItem value="monthly" className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">Monthly</SelectItem>
                              <SelectItem value="yearly" className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {reservationData.recurring !== 'none' && (
                          <div>
                            <Label className="text-foreground">Number of occurrences</Label>
                            <Select 
                              value={reservationData.recurringOccurrences.toString()}
                              onValueChange={(value) => setReservationData(prev => ({ ...prev, recurringOccurrences: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-2 bg-background border-border text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 26, 30, 36, 40, 48, 52].map((num) => (
                                  <SelectItem key={num} value={num.toString()} className="text-popover-foreground hover:bg-accent hover:text-accent-foreground">
                                    {num} times
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Cost Preview */}
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rate</span>
                          <span className="text-foreground">${hourlyRate}/hour</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="text-foreground">{reservationData.duration} hour{reservationData.duration > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="text-foreground">${(hourlyRate || 0) * reservationData.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax (8.5%)</span>
                          <span className="text-foreground">${(((hourlyRate || 0) * reservationData.duration) * 0.085).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-border pt-2">
                          <div className="flex justify-between font-medium">
                            <span className="text-foreground">Total per booking</span>
                            <span className="text-foreground">${(((hourlyRate || 0) * reservationData.duration) * 1.085).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {reservationData.recurring !== 'none' && reservationData.recurringOccurrences > 1 && (
                          <>
                            <div className="border-t border-border pt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Recurring {reservationData.recurring}
                                </span>
                                <span className="text-foreground">
                                  {reservationData.recurringOccurrences} occurrences
                                </span>
                              </div>
                              <div className="flex justify-between font-semibold text-base">
                                <span className="text-foreground">Total for all bookings</span>
                                <span className="text-primary">
                                  ${((((hourlyRate || 0) * reservationData.duration) * 1.085) * reservationData.recurringOccurrences).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <Button 
                        onClick={addToCart}
                        disabled={!reservationData.timeSlot || !selectedDate || !isSlotAvailable(reservationData.timeSlot, reservationData.duration, availableTimeSlots)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                        size="lg"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart - ${
                          reservationData.recurring !== 'none' && reservationData.recurringOccurrences > 1
                            ? ((((hourlyRate || 0) * reservationData.duration) * 1.085) * reservationData.recurringOccurrences).toFixed(2)
                            : (((hourlyRate || 0) * reservationData.duration) * 1.085).toFixed(2)
                        }
                        {reservationData.recurring !== 'none' && reservationData.recurringOccurrences > 1 && (
                          <span className="ml-1 text-xs">({reservationData.recurringOccurrences}x)</span>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Debug auth state
  console.log('Render Debug - user:', user, 'userLoading:', userLoading);

  if (showAuthModal) {
    console.log('Modal open, preventing page navigation temporarily');
  }

  return isOpen ? createPortal(
    <>
      {modalContent}
      {/* Authentication Required Modal */}
      <Dialog open={showAuthModal} onOpenChange={(open) => !open && setShowAuthModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Account Required
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Your reservation details have been saved
              </p>
              <p className="text-sm text-muted-foreground">
                We'll submit your reservation automatically after you create your account.
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting to sign up page...
              </p>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Your Reservation Summary:</h4>
              <div className="text-sm space-y-1">
                <p className="flex justify-between">
                  <span>Field:</span>
                  <span className="font-medium">
                    {cart.map(item => {
                      if (item.itemType === 'field' && 'name' in item.item) {
                        return item.item.name;
                      } else if (item.itemType === 'room' && 'room_number' in item.item) {
                        return `Room ${item.item.room_number}`;
                      }
                      return '';
                    }).filter(Boolean).join(', ')}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Date:</span>
                  <span className="font-medium">
                    {cart.length > 0 ? format(cart[0].date, 'MMM d, yyyy') : format(new Date(), 'MMM d, yyyy')}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>,
    document.body
  ) : null;
}
