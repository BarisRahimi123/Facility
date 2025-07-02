-- Create maintenance request types
CREATE TYPE maintenance_status AS ENUM (
  'pending',
  'approved',
  'in_progress',
  'completed',
  'rejected',
  'cancelled'
);

CREATE TYPE maintenance_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent',
  'emergency'
);

CREATE TYPE maintenance_type AS ENUM (
  'repair',
  'inspection',
  'preventive',
  'replacement',
  'cleaning',
  'upgrade',
  'other'
);

-- Create maintenance requests table
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  system_id UUID REFERENCES building_systems(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type maintenance_type NOT NULL,
  priority maintenance_priority NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  start_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance request notes table
CREATE TABLE maintenance_request_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance request attachments table
CREATE TABLE maintenance_request_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_maintenance_requests_building_id ON maintenance_requests(building_id);
CREATE INDEX idx_maintenance_requests_room_id ON maintenance_requests(room_id);
CREATE INDEX idx_maintenance_requests_system_id ON maintenance_requests(system_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_requested_by ON maintenance_requests(requested_by);
CREATE INDEX idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);

-- Add RLS policies
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_request_attachments ENABLE ROW LEVEL SECURITY;

-- Policies for maintenance requests
CREATE POLICY "Users can view their own requests" ON maintenance_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
    )
  );

CREATE POLICY "Users can create requests" ON maintenance_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own requests" ON maintenance_requests
  FOR UPDATE USING (
    requested_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
    )
  );

CREATE POLICY "Only admins and maintenance staff can delete requests" ON maintenance_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
    )
  );

-- Policies for maintenance request notes
CREATE POLICY "Users can view notes for requests they can see" ON maintenance_request_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests
      WHERE maintenance_requests.id = maintenance_request_notes.request_id
      AND (
        maintenance_requests.requested_by = auth.uid() OR
        maintenance_requests.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
        )
      )
    )
  );

CREATE POLICY "Users can add notes to requests they can see" ON maintenance_request_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_requests
      WHERE maintenance_requests.id = maintenance_request_notes.request_id
      AND (
        maintenance_requests.requested_by = auth.uid() OR
        maintenance_requests.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
        )
      )
    )
  );

-- Policies for maintenance request attachments
CREATE POLICY "Users can view attachments for requests they can see" ON maintenance_request_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests
      WHERE maintenance_requests.id = maintenance_request_attachments.request_id
      AND (
        maintenance_requests.requested_by = auth.uid() OR
        maintenance_requests.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
        )
      )
    )
  );

CREATE POLICY "Users can add attachments to requests they can see" ON maintenance_request_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_requests
      WHERE maintenance_requests.id = maintenance_request_attachments.request_id
      AND (
        maintenance_requests.requested_by = auth.uid() OR
        maintenance_requests.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND (users.role = 'master_admin' OR users.role = 'sub_master' OR users.role = 'maintenance')
        )
      )
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 