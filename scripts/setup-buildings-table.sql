-- Ensure buildings table has all required columns
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id),
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS building_number TEXT,
ADD COLUMN IF NOT EXISTS building_type TEXT,
ADD COLUMN IF NOT EXISTS construction_date DATE,
ADD COLUMN IF NOT EXISTS square_footage NUMERIC,
ADD COLUMN IF NOT EXISTS number_of_rooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on facility_id for better performance
CREATE INDEX IF NOT EXISTS idx_buildings_facility_id ON buildings(facility_id);

-- Disable RLS for testing
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY; 