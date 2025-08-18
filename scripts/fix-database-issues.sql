-- Fix Database Issues Found in Vercel Logs
-- This script addresses:
-- 1. Missing reservations table (causing PGRST200 error)
-- 2. Missing users.name column (causing 42703 error)

-- =============================================================================
-- 1. CREATE RESERVATIONS TABLE
-- =============================================================================

-- Create reservations table with proper structure and relationships
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
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
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- =============================================================================
-- 2. ADD NAME COLUMN TO USERS TABLE
-- =============================================================================

-- Check if users table exists and add name column if missing
DO $$
BEGIN
  -- Check if users table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN
      -- Add name column
      ALTER TABLE public.users ADD COLUMN name TEXT;
      
      -- Update existing records to populate name from first_name + last_name or email
      UPDATE public.users 
      SET name = CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
          CONCAT(first_name, ' ', last_name)
        WHEN first_name IS NOT NULL THEN 
          first_name
        WHEN last_name IS NOT NULL THEN 
          last_name
        ELSE 
          SPLIT_PART(email, '@', 1)
      END
      WHERE name IS NULL;
      
      -- Make name column NOT NULL after populating
      ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;
      
      RAISE NOTICE 'Added name column to users table and populated existing records';
    ELSE
      RAISE NOTICE 'Name column already exists in users table';
    END IF;
  ELSE
    RAISE NOTICE 'Users table does not exist - this may need to be created first';
  END IF;
END
$$;

-- =============================================================================
-- 3. CREATE RESERVATION_SLOTS TABLE (if needed)
-- =============================================================================

-- Create reservation_slots table for the reservation query that joins to it
CREATE TABLE IF NOT EXISTS public.reservation_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservation_slots_reservation_id ON public.reservation_slots(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_slots_date ON public.reservation_slots(date);

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on reservations table
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_slots ENABLE ROW LEVEL SECURITY;

-- Create policies for reservations (adjust based on your auth requirements)
-- Policy for users to see their own reservations
CREATE POLICY "Users can view own reservations" ON public.reservations
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy for users to create their own reservations  
CREATE POLICY "Users can create own reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy for users to update their own reservations
CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy for admin users to see all reservations (adjust role checking as needed)
CREATE POLICY "Admins can view all reservations" ON public.reservations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('master_admin', 'sub_admin', 'district_approver', 'site_approver')
    )
  );

-- Similar policies for reservation_slots
CREATE POLICY "Users can view own reservation slots" ON public.reservation_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reservations r 
      WHERE r.id = reservation_id 
      AND r.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all reservation slots" ON public.reservation_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id::text = auth.uid()::text 
      AND role IN ('master_admin', 'sub_admin', 'district_approver', 'site_approver')
    )
  );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Test the fixes
DO $$
BEGIN
  -- Test reservations table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
    RAISE NOTICE '✅ Reservations table exists';
  ELSE
    RAISE NOTICE '❌ Reservations table still missing';
  END IF;
  
  -- Test users.name column
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN
    RAISE NOTICE '✅ Users.name column exists';
  ELSE
    RAISE NOTICE '❌ Users.name column still missing';
  END IF;
  
  -- Test foreign key from reservations to fields
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reservations'
    AND kcu.column_name = 'field_id'
    AND ccu.table_name = 'fields'
  ) THEN
    RAISE NOTICE '✅ Reservations → Fields foreign key exists';
  ELSE
    RAISE NOTICE '❌ Reservations → Fields foreign key missing';
  END IF;
END
$$;
