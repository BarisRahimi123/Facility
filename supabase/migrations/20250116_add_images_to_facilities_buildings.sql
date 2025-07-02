-- Add image fields to facilities and buildings tables
-- This enables displaying images in grid view and uploading images in forms

-- Add image fields to facilities table
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_description TEXT;

-- Add image fields to buildings table
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_description TEXT;

-- Add comments for clarity
COMMENT ON COLUMN facilities.image_url IS 'URL to the facility image for display in grid view';
COMMENT ON COLUMN facilities.image_description IS 'Description or alt text for the facility image';
COMMENT ON COLUMN buildings.image_url IS 'URL to the building image for display in grid view';
COMMENT ON COLUMN buildings.image_description IS 'Description or alt text for the building image'; 