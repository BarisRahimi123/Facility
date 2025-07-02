-- =====================================================
-- STAFF FACILITY ASSIGNMENTS SYSTEM
-- Migration to handle staff assignments to facilities
-- =====================================================

-- Create staff_facility_assignments table
CREATE TABLE IF NOT EXISTS staff_facility_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  
  -- Ensure unique assignment per user per facility
  UNIQUE(user_id, facility_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_facility_assignments_user_id ON staff_facility_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_facility_assignments_facility_id ON staff_facility_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_staff_facility_assignments_role ON staff_facility_assignments(role);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_staff_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_assignments_updated_at_trigger
  BEFORE UPDATE ON staff_facility_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_assignments_updated_at();

-- Enable RLS
ALTER TABLE staff_facility_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Staff can view their own assignments
CREATE POLICY "Staff can view own assignments"
  ON staff_facility_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage all assignments
CREATE POLICY "Admins can manage all assignments"
  ON staff_facility_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'district_admin')
    )
  );

-- Enhanced blockout_dates table for better staff management
CREATE TABLE IF NOT EXISTS field_blockout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
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
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes for blockout dates
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_field_id ON field_blockout_dates(field_id);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_created_by ON field_blockout_dates(created_by);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_date_range ON field_blockout_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_status ON field_blockout_dates(status);

-- Enable RLS for blockout dates
ALTER TABLE field_blockout_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blockout dates
-- Staff can manage blockouts for their assigned facilities
CREATE POLICY "Staff can manage blockouts for assigned facilities"
  ON field_blockout_dates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_facility_assignments sfa
      JOIN fields f ON f.facility_id = sfa.facility_id
      WHERE f.id = field_blockout_dates.field_id
      AND sfa.user_id = auth.uid()
      AND sfa.permissions->>'create_blockouts' = 'true'
    )
  );

-- Public can view active blockouts (for availability checking)
CREATE POLICY "Public can view active blockouts"
  ON field_blockout_dates FOR SELECT
  USING (status = 'active');

-- Insert sample staff assignments for testing
INSERT INTO staff_facility_assignments (user_id, facility_id, role, permissions)
VALUES 
  -- This will need to be updated with actual user IDs once users are created
  -- For now, using placeholder UUIDs that can be updated later
  ('00000000-0000-0000-0000-000000000001', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'manager', '{
    "manage_calendar": true,
    "create_blockouts": true,
    "view_reservations": true,
    "manage_reservations": true,
    "view_reports": true
  }'),
  ('00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'staff', '{
    "manage_calendar": true,
    "create_blockouts": true,
    "view_reservations": true,
    "manage_reservations": false,
    "view_reports": true
  }')
ON CONFLICT (user_id, facility_id) DO NOTHING;

-- Insert sample blockout dates
INSERT INTO field_blockout_dates (field_id, start_date, end_date, reason, description, status)
SELECT 
  f.id,
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '9 days',
  'Maintenance',
  'Field renovation and reseeding',
  'active'
FROM fields f
LIMIT 2
ON CONFLICT DO NOTHING; 