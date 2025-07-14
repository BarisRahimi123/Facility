-- Create maintenance tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic task information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('corrective', 'preventive', 'emergency')) DEFAULT 'corrective',
  priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status VARCHAR(50) CHECK (status IN ('new', 'pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'new',
  workflow_status VARCHAR(50) DEFAULT 'new',
  
  -- Dates and duration
  start_date TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER, -- in minutes
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Location and system info
  location VARCHAR(255),
  system_type VARCHAR(100),
  issue_type VARCHAR(100),
  impact VARCHAR(50) CHECK (impact IN ('low', 'medium', 'high')),
  severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high')),
  
  -- Assignment info
  assignment_type VARCHAR(50) CHECK (assignment_type IN ('internal', 'external')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Submitter info
  submitter_name VARCHAR(255),
  submitter_email VARCHAR(255),
  submitter_phone VARCHAR(50),
  
  -- Notes and metadata
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task assignments table for internal staff
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) CHECK (role IN ('assignee', 'observer', 'approver')) DEFAULT 'assignee',
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(task_id, user_id)
);

-- Create external contractor invitations table
CREATE TABLE IF NOT EXISTS task_contractor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  role VARCHAR(50) CHECK (role IN ('contractor', 'vendor', 'consultant')) DEFAULT 'contractor',
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  notes TEXT
);

-- Create task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task activity log table
CREATE TABLE IF NOT EXISTS task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  specialties TEXT[], 
  rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create request for quotes table
CREATE TABLE IF NOT EXISTS request_for_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('draft', 'sent', 'responded', 'expired', 'cancelled')) DEFAULT 'draft',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scope TEXT,
  required_completion_date TIMESTAMP WITH TIME ZONE,
  sent_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RFQ vendor invitations table
CREATE TABLE IF NOT EXISTS rfq_vendor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES request_for_quotes(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  invitation_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rfq_id, vendor_id)
);

-- Create indexes for better performance
CREATE INDEX idx_maintenance_tasks_facility ON maintenance_tasks(facility_id);
CREATE INDEX idx_maintenance_tasks_building ON maintenance_tasks(building_id);
CREATE INDEX idx_maintenance_tasks_organization ON maintenance_tasks(organization_id);
CREATE INDEX idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX idx_maintenance_tasks_assigned_to ON maintenance_tasks(assigned_to);
CREATE INDEX idx_task_assignments_user ON task_assignments(user_id);
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_contractor_invitations_token ON task_contractor_invitations(token);
CREATE INDEX idx_contractor_invitations_email ON task_contractor_invitations(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_maintenance_tasks_updated_at BEFORE UPDATE ON maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_request_for_quotes_updated_at BEFORE UPDATE ON request_for_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_contractor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_for_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_vendor_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for maintenance_tasks
CREATE POLICY "Users can view tasks in their organization" ON maintenance_tasks
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE organization_id = maintenance_tasks.organization_id
    ) OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('master_admin', 'district_approver')
    )
  );

CREATE POLICY "Users can create tasks in their organization" ON maintenance_tasks
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE organization_id = maintenance_tasks.organization_id
    ) OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('master_admin', 'district_approver')
    )
  );

CREATE POLICY "Users can update tasks in their organization" ON maintenance_tasks
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE organization_id = maintenance_tasks.organization_id
    ) OR
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('master_admin', 'district_approver')
    )
  );

-- Create RLS policies for task_assignments
CREATE POLICY "Users can view task assignments" ON task_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_tasks 
      WHERE maintenance_tasks.id = task_assignments.task_id
      AND (
        auth.uid() IN (
          SELECT id FROM users WHERE organization_id = maintenance_tasks.organization_id
        ) OR
        auth.uid() IN (
          SELECT id FROM users WHERE role IN ('master_admin', 'district_approver')
        )
      )
    )
  );

-- Create RLS policies for contractor invitations
CREATE POLICY "Users can view contractor invitations" ON task_contractor_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM maintenance_tasks 
      WHERE maintenance_tasks.id = task_contractor_invitations.task_id
      AND (
        auth.uid() IN (
          SELECT id FROM users WHERE organization_id = maintenance_tasks.organization_id
        ) OR
        auth.uid() IN (
          SELECT id FROM users WHERE role IN ('master_admin', 'district_approver')
        )
      )
    )
  );

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create function to log task activity
CREATE OR REPLACE FUNCTION log_task_activity(
  p_task_id UUID,
  p_user_id UUID,
  p_action VARCHAR(100),
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO task_activity_log (task_id, user_id, action, details)
  VALUES (p_task_id, p_user_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users
GRANT ALL ON maintenance_tasks TO authenticated;
GRANT ALL ON task_assignments TO authenticated;
GRANT ALL ON task_contractor_invitations TO authenticated;
GRANT ALL ON task_attachments TO authenticated;
GRANT ALL ON task_comments TO authenticated;
GRANT ALL ON task_activity_log TO authenticated;
GRANT ALL ON vendors TO authenticated;
GRANT ALL ON request_for_quotes TO authenticated;
GRANT ALL ON rfq_vendor_invitations TO authenticated; 