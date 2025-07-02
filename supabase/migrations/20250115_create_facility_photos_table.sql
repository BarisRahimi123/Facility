-- Migration: Create facility_photos table and storage bucket
-- Date: 2025-01-15
-- Purpose: Add facility photo management functionality

-- Create facility_photos table
CREATE TABLE IF NOT EXISTS facility_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facility_photos_facility_id ON facility_photos(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_photos_created_at ON facility_photos(created_at DESC);

-- Add RLS (Row Level Security) policy
ALTER TABLE facility_photos ENABLE ROW LEVEL SECURITY;

-- Create policy for facility photos (allow all operations for now)
CREATE POLICY "Allow all operations on facility_photos" ON facility_photos
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for facility photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('facility-photos', 'facility-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for facility-photos bucket
CREATE POLICY "Allow public read access to facility photos" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'facility-photos');

CREATE POLICY "Allow authenticated users to upload facility photos" ON storage.objects
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (bucket_id = 'facility-photos');

CREATE POLICY "Allow authenticated users to update facility photos" ON storage.objects
  FOR UPDATE
  TO authenticated, anon
  USING (bucket_id = 'facility-photos')
  WITH CHECK (bucket_id = 'facility-photos');

CREATE POLICY "Allow authenticated users to delete facility photos" ON storage.objects
  FOR DELETE
  TO authenticated, anon
  USING (bucket_id = 'facility-photos');

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_facility_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facility_photos_updated_at_trigger
  BEFORE UPDATE ON facility_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_photos_updated_at(); 