-- Create fields table for rentable areas
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- football, soccer, basketball, tennis, pool, track, baseball, etc.
  surface_type TEXT, -- turf, grass, concrete, asphalt, synthetic, clay, etc.
  dimensions TEXT, -- e.g., "100x50 yards", "25x12 meters"
  area_sq_ft INTEGER,
  capacity INTEGER, -- max occupancy
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  daily_rate DECIMAL(10,2) DEFAULT 0,
  
  -- Location and mapping
  street_address TEXT, -- Simplified address entry
  zip_code TEXT, -- ZIP code for geocoding
  city TEXT, -- Auto-filled from geocoding
  state TEXT, -- Auto-filled from geocoding
  full_address TEXT, -- Complete address string
  mapbox_geometry JSONB, -- GeoJSON polygon for field boundaries
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  
  -- Features and amenities
  ada_compliant BOOLEAN DEFAULT false,
  has_lighting BOOLEAN DEFAULT false,
  has_scoreboard BOOLEAN DEFAULT false,
  has_restrooms BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  parking_spots INTEGER,
  
  -- Availability and status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'maintenance', 'inactive')),
  maintenance_status TEXT DEFAULT 'good' CHECK (maintenance_status IN ('excellent', 'good', 'fair', 'poor')),
  instant_booking BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Media and documentation
  image_url TEXT,
  image_description TEXT,
  description TEXT,
  rules_and_policies TEXT,
  rental_agreement_template TEXT,
  
  -- Usage categories for public rental
  possible_uses JSONB, -- Array of possible uses like ['Sports Events', 'Training', 'Tournaments', 'Recreation']
  
  -- Virtual tour and additional media
  virtual_tour_url TEXT,
  virtual_tour_description TEXT,
  gallery_images JSONB, -- Array of image URLs
  
  -- Aerial imagery for map overlays
  aerial_image_url TEXT, -- URL to uploaded aerial/mosaic image
  aerial_image_description TEXT, -- Description of aerial image
  aerial_image_bounds JSONB, -- Bounding box coordinates for map overlay
  
  -- Administrative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create reservations table for bookings
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  
  -- Booking details
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  booking_type TEXT DEFAULT 'hourly' CHECK (booking_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  repeat_pattern TEXT CHECK (repeat_pattern IN ('none', 'daily', 'weekly', 'monthly')),
  repeat_until DATE,
  
  -- Renter information
  renter_name TEXT NOT NULL,
  renter_email TEXT NOT NULL,
  renter_phone TEXT,
  organization_name TEXT,
  purpose_of_use TEXT NOT NULL,
  estimated_attendees INTEGER,
  
  -- Financial
  total_amount DECIMAL(10,2) NOT NULL,
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Status and approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed')),
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Documentation
  insurance_certificate_url TEXT,
  signed_agreement_url TEXT,
  po_number TEXT,
  special_requests TEXT,
  
  -- Payment tracking
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Liability and waivers
  liability_waiver_signed BOOLEAN DEFAULT false,
  liability_waiver_signed_at TIMESTAMP WITH TIME ZONE,
  liability_waiver_ip TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Administrative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Prevent overlapping reservations
  CONSTRAINT no_overlapping_reservations EXCLUDE USING gist (
    field_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status != 'cancelled' AND status != 'rejected')
);

-- Create blackout_dates table for field unavailability
CREATE TABLE IF NOT EXISTS public.field_blackout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('weekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_blackout_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fields
CREATE POLICY "Fields are viewable by everyone"
  ON public.fields FOR SELECT USING (true);

CREATE POLICY "Fields are insertable by authenticated users"
  ON public.fields FOR INSERT WITH CHECK (true);

CREATE POLICY "Fields are updatable by authenticated users"
  ON public.fields FOR UPDATE USING (true);

CREATE POLICY "Fields are deletable by authenticated users"
  ON public.fields FOR DELETE USING (true);

-- RLS Policies for reservations
CREATE POLICY "Reservations are viewable by everyone"
  ON public.reservations FOR SELECT USING (true);

CREATE POLICY "Reservations are insertable by authenticated users"
  ON public.reservations FOR INSERT WITH CHECK (true);

CREATE POLICY "Reservations are updatable by authenticated users"
  ON public.reservations FOR UPDATE USING (true);

CREATE POLICY "Reservations are deletable by authenticated users"
  ON public.reservations FOR DELETE USING (true);

-- RLS Policies for blackout dates
CREATE POLICY "Blackout dates are viewable by everyone"
  ON public.field_blackout_dates FOR SELECT USING (true);

CREATE POLICY "Blackout dates are insertable by authenticated users"
  ON public.field_blackout_dates FOR INSERT WITH CHECK (true);

CREATE POLICY "Blackout dates are updatable by authenticated users"
  ON public.field_blackout_dates FOR UPDATE USING (true);

CREATE POLICY "Blackout dates are deletable by authenticated users"
  ON public.field_blackout_dates FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fields_facility_id ON public.fields(facility_id);
CREATE INDEX IF NOT EXISTS idx_fields_type ON public.fields(type);
CREATE INDEX IF NOT EXISTS idx_fields_status ON public.fields(status);
CREATE INDEX IF NOT EXISTS idx_fields_location ON public.fields(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time_range ON public.reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_renter_email ON public.reservations(renter_email);

CREATE INDEX IF NOT EXISTS idx_blackout_dates_field_id ON public.field_blackout_dates(field_id);
CREATE INDEX IF NOT EXISTS idx_blackout_dates_date_range ON public.field_blackout_dates(start_date, end_date);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language plpgsql;

CREATE OR REPLACE FUNCTION public.handle_updated_at_reservations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language plpgsql;

CREATE OR REPLACE TRIGGER fields_updated_at
  BEFORE UPDATE ON public.fields
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_fields();

CREATE OR REPLACE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_reservations();

-- Add comments for documentation
COMMENT ON TABLE public.fields IS 'Rentable facility areas like sports fields, courts, pools, etc.';
COMMENT ON TABLE public.reservations IS 'Field booking and rental reservations';
COMMENT ON TABLE public.field_blackout_dates IS 'Dates when fields are unavailable for booking';

COMMENT ON COLUMN public.fields.mapbox_geometry IS 'GeoJSON polygon defining field boundaries for map display';
COMMENT ON COLUMN public.fields.instant_booking IS 'Whether field can be booked immediately without approval';
COMMENT ON COLUMN public.reservations.repeat_pattern IS 'How often the reservation repeats (for recurring bookings)';
COMMENT ON COLUMN public.reservations.liability_waiver_signed IS 'Whether renter has signed liability waiver'; 