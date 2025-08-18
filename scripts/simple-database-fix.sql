-- Simple Database Fixes for Vercel Errors
-- Run this in Supabase SQL Editor

-- 1. Add name column to users table (if it exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Update name column from email if it's empty/null
UPDATE users 
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR name = '';

-- 3. Make name column NOT NULL
UPDATE users SET name = COALESCE(name, email, 'Unknown User') WHERE name IS NULL;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- 4. Check if fields table exists before creating reservations
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fields') THEN
    -- Create reservations table with minimal structure
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      field_id UUID REFERENCES fields(id),
      facility_id UUID REFERENCES facilities(id),
      user_id UUID REFERENCES users(id),
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create reservation_slots table referenced in the query
    CREATE TABLE IF NOT EXISTS reservation_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id UUID REFERENCES reservations(id),
      date DATE,
      start_time TIME,
      end_time TIME,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created reservations and reservation_slots tables';
  ELSE
    RAISE NOTICE 'Fields table does not exist - skipping reservations table creation';
  END IF;
END $$;

-- 5. Verify the fixes
SELECT 
  'users.name column' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'reservations table' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'reservations'
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
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status;
