-- Fix Remaining Database Issues
-- Run this in Supabase SQL Editor to fix the MISSING items

-- 1. Fix users.name column issue
-- First check if users table exists and what columns it has
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
    
    -- Make sure no nulls remain and set NOT NULL constraint
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

-- 2. Fix reservations→fields foreign key
-- Drop and recreate the reservations table with proper foreign key
DO $$
BEGIN
  -- Check if fields table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fields') THEN
    
    -- Drop existing reservations table if it exists without proper FK
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
      -- Check if FK exists
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'reservations'
        AND kcu.column_name = 'field_id'
        AND tc.table_schema = 'public'
      ) THEN
        -- FK doesn't exist, recreate table
        DROP TABLE IF EXISTS public.reservation_slots;
        DROP TABLE IF EXISTS public.reservations;
        RAISE NOTICE 'Dropped existing reservations table to recreate with proper FK';
      END IF;
    END IF;
    
    -- Create reservations table with proper foreign key constraints
    CREATE TABLE IF NOT EXISTS public.reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
      facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      
      -- Basic reservation data
      date DATE,
      start_time TIME,
      end_time TIME,
      status TEXT DEFAULT 'pending',
      
      -- Contact info
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create reservation_slots table
    CREATE TABLE IF NOT EXISTS public.reservation_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
      date DATE,
      start_time TIME,
      end_time TIME,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
    
    RAISE NOTICE 'Created reservations table with proper foreign key to fields';
    
  ELSE
    RAISE NOTICE 'Fields table does not exist - cannot create FK constraint';
  END IF;
END $$;

-- 3. Verify the fixes again
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
