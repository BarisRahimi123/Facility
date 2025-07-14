-- Simplified reservations table creation for testing
-- RLS disabled for easier development

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
  recurring_index INTEGER,
  
  -- Administrative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- Disable RLS for testing
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;

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

-- Verify creation
SELECT 
  'Reservations table created!' as message,
  count(*) as columns,
  'RLS is DISABLED for testing' as note
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reservations'; 