-- Update facilities table to add missing columns
-- First check if columns exist before adding them

-- Add facility_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'facility_type') THEN
    ALTER TABLE facilities ADD COLUMN facility_type TEXT;
  END IF;
END $$;

-- Add total_square_footage column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'total_square_footage') THEN
    ALTER TABLE facilities ADD COLUMN total_square_footage INTEGER;
  END IF;
END $$;

-- Add square_footage column if it doesn't exist (alias for total_square_footage)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'square_footage') THEN
    ALTER TABLE facilities ADD COLUMN square_footage INTEGER;
  END IF;
END $$;

-- Add number_of_floors column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'number_of_floors') THEN
    ALTER TABLE facilities ADD COLUMN number_of_floors INTEGER;
  END IF;
END $$;

-- Add year_built column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'year_built') THEN
    ALTER TABLE facilities ADD COLUMN year_built TEXT;
  END IF;
END $$;

-- Add last_renovation_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'last_renovation_date') THEN
    ALTER TABLE facilities ADD COLUMN last_renovation_date TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add facility_condition_index column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'facility_condition_index') THEN
    ALTER TABLE facilities ADD COLUMN facility_condition_index INTEGER;
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'status') THEN
    ALTER TABLE facilities ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Add created_by column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'facilities' AND column_name = 'created_by') THEN
    ALTER TABLE facilities ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing facilities to have default values
UPDATE facilities 
SET 
  facility_type = COALESCE(facility_type, type, 'Office'),
  status = COALESCE(status, 'active')
WHERE facility_type IS NULL OR status IS NULL;

-- Drop the old 'type' column if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'facilities' AND column_name = 'type') THEN
    ALTER TABLE facilities DROP COLUMN type;
  END IF;
END $$; 