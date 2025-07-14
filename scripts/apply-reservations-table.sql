-- Create reservations table for field bookings
-- Note: Using public.users instead of auth.users since the app uses a custom users table

-- First, install the btree_gist extension if not already installed
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Booking time details
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  
  -- Pricing
  hourly_rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  
  -- Event details
  purpose TEXT,
  setup_requirements TEXT,
  tables_needed INTEGER DEFAULT 0,
  chairs_needed INTEGER DEFAULT 0,
  hvac_needed BOOLEAN DEFAULT false,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  organization TEXT,
  
  -- Recurring details
  recurring_type TEXT CHECK (recurring_type IN (NULL, 'weekly', 'monthly', 'yearly')),
  recurring_occurrences INTEGER,
  recurring_index INTEGER, -- For tracking individual occurrences in a series
  
  -- Administrative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Prevent overlapping reservations using composite constraint
  CONSTRAINT no_overlapping_field_reservations UNIQUE (field_id, date, start_time, end_time)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_contact_email ON public.reservations(contact_email);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Reservations are viewable by everyone"
  ON public.reservations FOR SELECT USING (true);

CREATE POLICY "Reservations are insertable by authenticated users"
  ON public.reservations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own reservations"
  ON public.reservations FOR UPDATE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('master_admin', 'district_approver', 'site_approver')
  ));

CREATE POLICY "Users can delete their own reservations"
  ON public.reservations FOR DELETE 
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('master_admin', 'district_approver')
  ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at_reservations()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language plpgsql;

CREATE OR REPLACE TRIGGER reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at_reservations();

-- Add comments
COMMENT ON TABLE public.reservations IS 'Field booking and rental reservations';
COMMENT ON COLUMN public.reservations.recurring_index IS 'For tracking individual occurrences in a recurring series';

-- Verify the table was created
SELECT 
  'Reservations table created successfully!' as message,
  count(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reservations'; 