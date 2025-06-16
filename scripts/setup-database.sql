-- Disable RLS for testing (remember to re-enable for production!)
ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;

-- Ensure facilities table has all required columns
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS facility_type TEXT,
ADD COLUMN IF NOT EXISTS square_footage INTEGER,
ADD COLUMN IF NOT EXISTS facility_condition_index INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS rooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_issues INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS occupancy_rate INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Update any existing rows to have default values
UPDATE facilities 
SET 
  facility_type = COALESCE(facility_type, type, 'Office'),
  status = COALESCE(status, 'active'),
  rooms = COALESCE(rooms, 0),
  active_issues = COALESCE(active_issues, 0),
  occupancy_rate = COALESCE(occupancy_rate, 0)
WHERE facility_type IS NULL OR status IS NULL;

-- Drop the old 'type' column if it exists
ALTER TABLE facilities DROP COLUMN IF EXISTS type;

-- Add some test data if the table is empty
INSERT INTO facilities (
  name, 
  facility_type, 
  address, 
  square_footage, 
  facility_condition_index, 
  status,
  description,
  rooms,
  active_issues,
  occupancy_rate
) 
SELECT 
  'Sample Office Building',
  'Office',
  '123 Test Street, Test City, TC 12345',
  50000,
  85,
  'active',
  'A sample facility for testing',
  20,
  2,
  90
WHERE NOT EXISTS (SELECT 1 FROM facilities LIMIT 1); 