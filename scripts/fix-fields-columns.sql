-- Fix fields table by adding missing address columns
-- Run this SQL in the Supabase SQL Editor to fix the "city column not found" error

-- Add missing address columns
ALTER TABLE fields ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Add some columns that might be missing from other migrations
ALTER TABLE fields ADD COLUMN IF NOT EXISTS aerial_image_url TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS aerial_image_description TEXT;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS aerial_image_bounds JSONB;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS possible_uses JSONB;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fields_coordinates ON fields (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fields_full_address ON fields (full_address);
CREATE INDEX IF NOT EXISTS idx_fields_city_state ON fields (city, state);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fields' 
AND column_name IN ('street_address', 'zip_code', 'city', 'state', 'full_address')
ORDER BY column_name; 