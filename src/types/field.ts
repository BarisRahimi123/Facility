// Field types for rental system
export interface Field {
  id: string;
  facility_id: string;
  name: string;
  type: FieldType;
  surface_type?: SurfaceType;
  dimensions?: string;
  area_sq_ft?: number;
  capacity?: number;
  hourly_rate: number;
  daily_rate: number;
  
  // Location and mapping
  street_address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  full_address?: string; // Auto-generated from components
  mapbox_geometry?: any; // GeoJSON
  latitude?: number;
  longitude?: number;
  
  // Features and amenities
  ada_compliant: boolean;
  has_lighting: boolean;
  has_scoreboard: boolean;
  has_restrooms: boolean;
  has_parking: boolean;
  parking_spots?: number;
  
  // Availability and status
  status: FieldStatus;
  maintenance_status: MaintenanceStatus;
  instant_booking: boolean;
  requires_approval: boolean;
  
  // Media and documentation
  image_url?: string;
  image_description?: string;
  description?: string;
  rules_and_policies?: string;
  rental_agreement_template?: string;
  
  // Usage categories for public rental
  possible_uses?: string[]; // e.g., ['Sports Events', 'Training', 'Tournaments', 'Recreation']
  
  // Virtual tour and additional media
  virtual_tour_url?: string;
  virtual_tour_description?: string;
  gallery_images?: string[]; // Array of image URLs
  
  // Aerial imagery
  aerial_image_url?: string;
  aerial_image_description?: string;
  aerial_image_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  
  // Administrative
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Reservation {
  id: string;
  field_id: string;
  facility_id: string;
  
  // Booking details
  start_time: string;
  end_time: string;
  booking_type: BookingType;
  repeat_pattern?: RepeatPattern;
  repeat_until?: string;
  
  // Renter information
  renter_name: string;
  renter_email: string;
  renter_phone?: string;
  organization_name?: string;
  purpose_of_use: string;
  estimated_attendees?: number;
  
  // Financial
  total_amount: number;
  hourly_rate?: number;
  daily_rate?: number;
  discount_amount: number;
  tax_amount: number;
  deposit_amount: number;
  
  // Status and approval
  status: ReservationStatus;
  approval_required: boolean;
  approved_by?: string;
  approved_at?: string;
  
  // Documentation
  insurance_certificate_url?: string;
  signed_agreement_url?: string;
  po_number?: string;
  special_requests?: string;
  
  // Payment tracking
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_reference?: string;
  paid_amount: number;
  
  // Liability and waivers
  liability_waiver_signed: boolean;
  liability_waiver_signed_at?: string;
  liability_waiver_ip?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Administrative
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface FieldBlackoutDate {
  id: string;
  field_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  recurring: boolean;
  recurring_pattern?: RecurringPattern;
  created_at: string;
  created_by?: string;
}

// Enums and types
export type FieldType = 
  | 'football'
  | 'soccer'
  | 'basketball'
  | 'tennis'
  | 'volleyball'
  | 'baseball'
  | 'softball'
  | 'track'
  | 'pool'
  | 'gymnasium'
  | 'auditorium'
  | 'conference_room'
  | 'multipurpose'
  | 'other';

export type SurfaceType = 
  | 'natural_grass'
  | 'artificial_turf'
  | 'concrete'
  | 'asphalt'
  | 'synthetic'
  | 'clay'
  | 'sand'
  | 'rubber'
  | 'wood'
  | 'other';

export type FieldStatus = 
  | 'available'
  | 'reserved'
  | 'maintenance'
  | 'inactive';

export type MaintenanceStatus = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor';

export type BookingType = 
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly';

export type RepeatPattern = 
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly';

export type ReservationStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export type PaymentStatus = 
  | 'pending'
  | 'partial'
  | 'paid'
  | 'refunded';

export type RecurringPattern = 
  | 'weekly'
  | 'monthly'
  | 'yearly';

// Utility types
export interface CreateFieldRequest {
  facility_id: string;
  name: string;
  type: FieldType;
  surface_type?: SurfaceType;
  dimensions?: string;
  area_sq_ft?: number;
  capacity?: number;
  hourly_rate: number;
  daily_rate: number;
  
  // Enhanced address with geocoding
  street_address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  full_address?: string; // Auto-generated complete address
  
  // Coordinates (auto-filled from address)
  latitude?: number;
  longitude?: number;
  
  ada_compliant?: boolean;
  has_lighting?: boolean;
  has_scoreboard?: boolean;
  has_restrooms?: boolean;
  has_parking?: boolean;
  parking_spots?: number;
  instant_booking?: boolean;
  requires_approval?: boolean;
  description?: string;
  rules_and_policies?: string;
  
  // Usage categories for public rental
  possible_uses?: string[]; // e.g., ['Sports Events', 'Training', 'Tournaments', 'Recreation']
  
  // Media uploads
  field_images?: File[];
  virtual_tour_url?: string;
  virtual_tour_description?: string;
  aerial_image?: File; // TIFF file support
  aerial_image_description?: string;
  
  // Image management
  existing_image_urls?: string[];
  primary_image_index?: number; // Index of the image to use as cover
}

export interface CreateReservationRequest {
  field_id: string;
  start_time: string;
  end_time: string;
  booking_type: BookingType;
  repeat_pattern?: RepeatPattern;
  repeat_until?: string;
  renter_name: string;
  renter_email: string;
  renter_phone?: string;
  organization_name?: string;
  purpose_of_use: string;
  estimated_attendees?: number;
  special_requests?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface FieldAvailability {
  field_id: string;
  date: string;
  available_slots: TimeSlot[];
  blackout_periods: BlackoutPeriod[];
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  rate: number;
}

export interface BlackoutPeriod {
  start_time: string;
  end_time: string;
  reason: string;
}

// Booking flow types
export interface BookingStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface BookingFlow {
  field: Field;
  selectedDate: string;
  selectedTimeSlot: TimeSlot;
  bookingDetails: Partial<CreateReservationRequest>;
  currentStep: number;
  steps: BookingStep[];
}

// Search and filter types
export interface FieldSearchFilters {
  facility_id?: string;
  type?: FieldType[];
  surface_type?: SurfaceType[];
  ada_compliant?: boolean;
  has_lighting?: boolean;
  has_parking?: boolean;
  min_capacity?: number;
  max_hourly_rate?: number;
  max_daily_rate?: number;
  available_on?: string;
  available_from?: string;
  available_to?: string;
} 