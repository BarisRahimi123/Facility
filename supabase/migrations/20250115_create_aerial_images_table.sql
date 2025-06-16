-- Create aerial_images table for facility drone photos and mapping data
CREATE TABLE IF NOT EXISTS aerial_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_type VARCHAR(50) NOT NULL CHECK (image_type IN ('drone_photo', 'mosaic', 'map', 'thermal', 'other')),
  image_url TEXT NOT NULL,
  capture_date DATE NOT NULL,
  resolution VARCHAR(100),
  coverage_area VARCHAR(100),
  altitude INTEGER, -- in feet
  camera_specs VARCHAR(255),
  processing_software VARCHAR(255),
  file_size BIGINT, -- in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aerial_images_facility_id ON aerial_images(facility_id);
CREATE INDEX IF NOT EXISTS idx_aerial_images_image_type ON aerial_images(image_type);
CREATE INDEX IF NOT EXISTS idx_aerial_images_capture_date ON aerial_images(capture_date);

-- Create RLS policies
ALTER TABLE aerial_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view aerial images for facilities they have access to
CREATE POLICY "Users can view aerial images" ON aerial_images
  FOR SELECT USING (true); -- For now, allow all authenticated users to view

-- Policy: Users can insert aerial images
CREATE POLICY "Users can insert aerial images" ON aerial_images
  FOR INSERT WITH CHECK (true); -- For now, allow all authenticated users to insert

-- Policy: Users can update aerial images
CREATE POLICY "Users can update aerial images" ON aerial_images
  FOR UPDATE USING (true); -- For now, allow all authenticated users to update

-- Policy: Users can delete aerial images
CREATE POLICY "Users can delete aerial images" ON aerial_images
  FOR DELETE USING (true); -- For now, allow all authenticated users to delete

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_aerial_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aerial_images_updated_at
  BEFORE UPDATE ON aerial_images
  FOR EACH ROW
  EXECUTE FUNCTION update_aerial_images_updated_at(); 