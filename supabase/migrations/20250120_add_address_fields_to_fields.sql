-- Add address fields to fields table
-- This migration adds the missing address columns that are referenced in the application

-- Add street_address column
ALTER TABLE fields ADD COLUMN IF NOT EXISTS street_address TEXT;

-- Add zip_code column  
ALTER TABLE fields ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);

-- Add city column
ALTER TABLE fields ADD COLUMN IF NOT EXISTS city TEXT;

-- Add state column
ALTER TABLE fields ADD COLUMN IF NOT EXISTS state VARCHAR(2);

-- Add full_address column (for complete geocoded address)
ALTER TABLE fields ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Create an index on latitude/longitude for spatial queries
CREATE INDEX IF NOT EXISTS idx_fields_coordinates ON fields (latitude, longitude);

-- Create an index on full_address for address searching
CREATE INDEX IF NOT EXISTS idx_fields_full_address ON fields (full_address);

-- Create an index on city and state for location filtering
CREATE INDEX IF NOT EXISTS idx_fields_city_state ON fields (city, state); 