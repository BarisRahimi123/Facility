-- Safe Database Fix - No Table Dropping
-- Run this in Supabase SQL Editor

-- 1. Fix users.name column (same as before)
DO $$
BEGIN
  -- Check if users table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name') THEN
      ALTER TABLE public.users ADD COLUMN name TEXT;
      RAISE NOTICE 'Added name column to users table';
    ELSE
      RAISE NOTICE 'Name column already exists in users table';
    END IF;
    
    -- Update empty/null name values
    UPDATE public.users 
    SET name = CASE 
      WHEN email IS NOT NULL THEN SPLIT_PART(email, '@', 1)
      ELSE 'User_' || id::text
    END
    WHERE name IS NULL OR name = '';
    
    -- Make sure no nulls remain
    UPDATE public.users SET name = 'Unknown User' WHERE name IS NULL;
    
    -- Try to set NOT NULL constraint
    BEGIN
      ALTER TABLE public.users ALTER COLUMN name SET NOT NULL;
      RAISE NOTICE 'Set name column to NOT NULL';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not set NOT NULL constraint: %', SQLERRM;
    END;
    
  ELSE
    RAISE NOTICE 'Users table does not exist in public schema';
  END IF;
END $$;

-- 2. Fix reservations table foreign key WITHOUT dropping it
DO $$
BEGIN
  -- Check if fields table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fields') THEN
    
    -- Add field_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'field_id') THEN
      ALTER TABLE public.reservations ADD COLUMN field_id UUID;
      RAISE NOTICE 'Added field_id column to reservations table';
    END IF;
    
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'reservations'
      AND kcu.column_name = 'field_id'
      AND tc.table_schema = 'public'
    ) THEN
      -- Try to add foreign key constraint
      BEGIN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT fk_reservations_field_id 
        FOREIGN KEY (field_id) REFERENCES public.fields(id);
        RAISE NOTICE 'Added foreign key constraint reservations -> fields';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add FK constraint: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'facility_id') THEN
      ALTER TABLE public.reservations ADD COLUMN facility_id UUID REFERENCES public.facilities(id);
      RAISE NOTICE 'Added facility_id column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'user_id') THEN
      ALTER TABLE public.reservations ADD COLUMN user_id UUID REFERENCES public.users(id);
      RAISE NOTICE 'Added user_id column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'status') THEN
      ALTER TABLE public.reservations ADD COLUMN status TEXT DEFAULT 'pending';
      RAISE NOTICE 'Added status column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'date') THEN
      ALTER TABLE public.reservations ADD COLUMN date DATE;
      RAISE NOTICE 'Added date column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'start_time') THEN
      ALTER TABLE public.reservations ADD COLUMN start_time TIME;
      RAISE NOTICE 'Added start_time column';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'end_time') THEN
      ALTER TABLE public.reservations ADD COLUMN end_time TIME;
      RAISE NOTICE 'Added end_time column';
    END IF;
    
    -- Create reservation_slots table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.reservation_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
      date DATE,
      start_time TIME,
      end_time TIME,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
    
    RAISE NOTICE 'Enhanced existing reservations table with proper structure';
    
  ELSE
    RAISE NOTICE 'Fields table does not exist - cannot create FK constraint';
  END IF;
END $$;

-- 3. Verify the fixes
SELECT 
  'users.name column' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'reservations table' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'reservations'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'reservations→fields FK' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reservations'
    AND kcu.column_name = 'field_id'
    AND tc.table_schema = 'public'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status;
