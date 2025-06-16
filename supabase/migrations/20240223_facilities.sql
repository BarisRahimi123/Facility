-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS buildings_facility_id_idx ON buildings(facility_id);
CREATE INDEX IF NOT EXISTS rooms_building_id_idx ON rooms(building_id);

-- Add RLS policies
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public to view facilities" ON facilities FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public to view buildings" ON buildings FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Allow public to view rooms" ON rooms FOR SELECT TO PUBLIC USING (true);

-- Insert some sample data
INSERT INTO facilities (id, name, type) VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Central High School', 'School'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Memorial Hospital', 'Hospital'),
  ('b47ac120-58cc-4372-a567-0e02b2c3d567', 'Tech Hub Office Complex', 'Office')
ON CONFLICT (id) DO NOTHING; 