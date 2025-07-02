-- =====================================================
-- STAFF FIELD AND ROOM ASSIGNMENTS SYSTEM
-- Migration to handle staff assignments to specific fields and rooms
-- =====================================================

-- Create staff_field_assignments table
CREATE TABLE IF NOT EXISTS staff_field_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'coordinator')),
  permissions JSONB NOT NULL DEFAULT '{
    "manage_calendar": true,
    "create_blockouts": true,
    "view_reservations": true,
    "manage_reservations": false,
    "view_reports": true
  }',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique assignment per user per field
  UNIQUE(user_id, field_id)
);

-- Create staff_room_assignments table
CREATE TABLE IF NOT EXISTS staff_room_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager', 'coordinator')),
  permissions JSONB NOT NULL DEFAULT '{
    "manage_calendar": true,
    "create_blockouts": true,
    "view_reservations": true,
    "manage_reservations": false,
    "view_reports": true
  }',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique assignment per user per room
  UNIQUE(user_id, room_id)
);

-- Create room_blockout_dates table for room availability management
CREATE TABLE IF NOT EXISTS room_blockout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern JSONB, -- For recurring blockouts
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure end_date >= start_date
  CONSTRAINT valid_room_date_range CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_field_assignments_user_id ON staff_field_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_field_assignments_field_id ON staff_field_assignments(field_id);
CREATE INDEX IF NOT EXISTS idx_staff_field_assignments_facility_id ON staff_field_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_staff_field_assignments_role ON staff_field_assignments(role);

CREATE INDEX IF NOT EXISTS idx_staff_room_assignments_user_id ON staff_room_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_room_assignments_room_id ON staff_room_assignments(room_id);
CREATE INDEX IF NOT EXISTS idx_staff_room_assignments_building_id ON staff_room_assignments(building_id);
CREATE INDEX IF NOT EXISTS idx_staff_room_assignments_facility_id ON staff_room_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_staff_room_assignments_role ON staff_room_assignments(role);

CREATE INDEX IF NOT EXISTS idx_room_blockout_dates_room_id ON room_blockout_dates(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blockout_dates_created_by ON room_blockout_dates(created_by);
CREATE INDEX IF NOT EXISTS idx_room_blockout_dates_date_range ON room_blockout_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_room_blockout_dates_status ON room_blockout_dates(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_staff_field_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_staff_room_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_room_blockout_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_field_assignments_updated_at_trigger
  BEFORE UPDATE ON staff_field_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_field_assignments_updated_at();

CREATE TRIGGER update_staff_room_assignments_updated_at_trigger
  BEFORE UPDATE ON staff_room_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_room_assignments_updated_at();

CREATE TRIGGER update_room_blockout_dates_updated_at_trigger
  BEFORE UPDATE ON room_blockout_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_room_blockout_dates_updated_at();

-- Enable RLS
ALTER TABLE staff_field_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_blockout_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_field_assignments
-- Staff can view their own assignments
CREATE POLICY "Staff can view own field assignments"
  ON staff_field_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage all assignments
CREATE POLICY "Admins can manage all field assignments"
  ON staff_field_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'district_admin')
    )
  );

-- RLS Policies for staff_room_assignments
-- Staff can view their own assignments
CREATE POLICY "Staff can view own room assignments"
  ON staff_room_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage all assignments
CREATE POLICY "Admins can manage all room assignments"
  ON staff_room_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'district_admin')
    )
  );

-- RLS Policies for room_blockout_dates
-- Staff can manage room blockouts for their assigned rooms
CREATE POLICY "Staff can manage room blockouts for assigned rooms"
  ON room_blockout_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_room_assignments sra
      WHERE sra.room_id = room_blockout_dates.room_id
      AND sra.user_id = auth.uid()
      AND sra.permissions->>'create_blockouts' = 'true'
    )
  );

-- Public can view active room blockouts (for availability checking)
CREATE POLICY "Public can view active room blockouts"
  ON room_blockout_dates FOR SELECT
  USING (status = 'active');

-- Insert sample staff field assignments for testing
INSERT INTO staff_field_assignments (user_id, field_id, facility_id, role, permissions)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  f.id,
  f.facility_id,
  'manager',
  '{
    "manage_calendar": true,
    "create_blockouts": true,
    "view_reservations": true,
    "manage_reservations": true,
    "view_reports": true
  }'
FROM fields f
LIMIT 2
ON CONFLICT (user_id, field_id) DO NOTHING;

-- Insert sample staff room assignments for testing
INSERT INTO staff_room_assignments (user_id, room_id, building_id, facility_id, role, permissions)
SELECT 
  '00000000-0000-0000-0000-000000000002',
  r.id,
  r.building_id,
  b.facility_id,
  'staff',
  '{
    "manage_calendar": true,
    "create_blockouts": true,
    "view_reservations": true,
    "manage_reservations": false,
    "view_reports": true
  }'
FROM rooms r
JOIN buildings b ON b.id = r.building_id
LIMIT 2
ON CONFLICT (user_id, room_id) DO NOTHING;

-- Insert sample room blockout dates
INSERT INTO room_blockout_dates (room_id, start_date, end_date, reason, description, status)
SELECT 
  r.id,
  CURRENT_DATE + INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '7 days',
  'Room Maintenance',
  'Cleaning and setup for new semester',
  'active'
FROM rooms r
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE staff_field_assignments IS 'Assigns staff members to specific fields for management';
COMMENT ON TABLE staff_room_assignments IS 'Assigns staff members to specific rooms for management';
COMMENT ON TABLE room_blockout_dates IS 'Dates when rooms are unavailable for use'; 