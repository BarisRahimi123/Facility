-- Create exec function for running raw SQL
CREATE OR REPLACE FUNCTION exec(sql text) RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Create enum types for task statuses
DO $$ 
BEGIN
  CREATE TYPE task_type AS ENUM ('corrective', 'preventive');
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
  CREATE TYPE task_status AS ENUM ('new', 'pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
  CREATE TYPE workflow_status AS ENUM (
    'new',
    'pending_estimate',
    'estimates_received',
    'estimate_accepted',
    'po_issued',
    'in_progress',
    'completed'
  );
EXCEPTION 
  WHEN duplicate_object THEN null;
END $$;

-- Create facilities table if it doesn't exist
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  facility_type TEXT NOT NULL,
  total_square_footage INTEGER,
  number_of_floors INTEGER,
  year_built TEXT,
  last_renovation_date TIMESTAMP WITH TIME ZONE,
  facility_condition_index INTEGER,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table if it doesn't exist
CREATE TABLE IF NOT EXISTS buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  square_footage INTEGER,
  number_of_floors INTEGER,
  year_built TEXT,
  last_renovation_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  floor_number INTEGER,
  room_number TEXT,
  square_footage INTEGER,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contractors table if it doesn't exist
CREATE TABLE IF NOT EXISTS contractors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  completed_jobs INTEGER DEFAULT 0,
  response_time TEXT,
  availability TEXT CHECK (availability IN ('Available', 'Busy', 'Unavailable')),
  last_hired TIMESTAMP WITH TIME ZONE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL DEFAULT 'corrective',
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'new',
  workflow_status workflow_status NOT NULL DEFAULT 'new',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  facility_id UUID REFERENCES facilities(id),
  building_id UUID REFERENCES buildings(id),
  room_id UUID REFERENCES rooms(id),
  location TEXT,
  system_type TEXT,
  issue_type TEXT,
  impact TEXT,
  severity TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('internal', 'contractor')),
  assigned_to TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  submitter_phone TEXT
);

-- Create RFQs table if it doesn't exist
CREATE TABLE IF NOT EXISTS request_for_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('draft', 'sent', 'responded', 'expired', 'cancelled')),
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT,
  required_completion_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create vendor estimates table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID REFERENCES request_for_quotes(id) ON DELETE CASCADE,
  vendor_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected')),
  total_amount DECIMAL(10,2) NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  availability_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  terms TEXT,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create estimate line items table if it doesn't exist
CREATE TABLE IF NOT EXISTS estimate_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES vendor_estimates(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Create workflow settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage VARCHAR NOT NULL,
  assignment_type VARCHAR NOT NULL CHECK (assignment_type IN ('internal', 'external')),
  notify_by_email BOOLEAN DEFAULT false,
  notify_by_sms BOOLEAN DEFAULT false,
  additional_actions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create form tokens table if it doesn't exist
DROP TABLE IF EXISTS form_tokens;
CREATE TABLE form_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR NOT NULL UNIQUE,
  status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for form tokens
CREATE INDEX IF NOT EXISTS idx_form_tokens_token ON form_tokens(token);
CREATE INDEX IF NOT EXISTS idx_form_tokens_status ON form_tokens(status);

-- Create indexes if they don't exist
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_facility ON tasks(facility_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON tasks(workflow_status);
  CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_rfq_task ON request_for_quotes(task_id);
  CREATE INDEX IF NOT EXISTS idx_estimates_rfq ON vendor_estimates(rfq_id);
  CREATE INDEX IF NOT EXISTS idx_line_items_estimate ON estimate_line_items(estimate_id);
  CREATE INDEX IF NOT EXISTS idx_contractors_name ON contractors(name);
  CREATE INDEX IF NOT EXISTS idx_contractors_type ON contractors(type);
  CREATE INDEX IF NOT EXISTS idx_contractors_availability ON contractors(availability);
  CREATE INDEX IF NOT EXISTS idx_buildings_facility ON buildings(facility_id);
  CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building_id);
  CREATE INDEX IF NOT EXISTS idx_workflow_settings_stage ON workflow_settings(stage);
END $$;

-- Enable RLS
DO $$ 
BEGIN
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE request_for_quotes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE vendor_estimates ENABLE ROW LEVEL SECURITY;
  ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
EXCEPTION 
  WHEN others THEN null;
END $$;

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Enable read access for all users" ON contractors;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON contractors;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON contractors;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON contractors;
  
  DROP POLICY IF EXISTS "Enable read access for all users" ON facilities;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON facilities;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON facilities;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON facilities;
  
  DROP POLICY IF EXISTS "Enable read access for all users" ON buildings;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON buildings;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON buildings;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON buildings;
  
  DROP POLICY IF EXISTS "Enable read access for all users" ON rooms;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rooms;
  DROP POLICY IF EXISTS "Enable update for authenticated users only" ON rooms;
  DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON rooms;
EXCEPTION 
  WHEN others THEN null;
END $$;

-- Create policies
DO $$ 
BEGIN
  -- Contractors policies
  CREATE POLICY "Enable read access for all users" ON contractors FOR SELECT USING (true);
  CREATE POLICY "Enable insert for authenticated users only" ON contractors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  CREATE POLICY "Enable update for authenticated users only" ON contractors FOR UPDATE USING (auth.role() = 'authenticated');
  CREATE POLICY "Enable delete for authenticated users only" ON contractors FOR DELETE USING (auth.role() = 'authenticated');

  -- Facilities policies
  CREATE POLICY "Enable read access for all users" ON facilities FOR SELECT USING (true);
  CREATE POLICY "Enable insert for authenticated users only" ON facilities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  CREATE POLICY "Enable update for authenticated users only" ON facilities FOR UPDATE USING (auth.role() = 'authenticated');
  CREATE POLICY "Enable delete for authenticated users only" ON facilities FOR DELETE USING (auth.role() = 'authenticated');

  -- Buildings policies
  CREATE POLICY "Enable read access for all users" ON buildings FOR SELECT USING (true);
  CREATE POLICY "Enable insert for authenticated users only" ON buildings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  CREATE POLICY "Enable update for authenticated users only" ON buildings FOR UPDATE USING (auth.role() = 'authenticated');
  CREATE POLICY "Enable delete for authenticated users only" ON buildings FOR DELETE USING (auth.role() = 'authenticated');

  -- Rooms policies
  CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
  CREATE POLICY "Enable insert for authenticated users only" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  CREATE POLICY "Enable update for authenticated users only" ON rooms FOR UPDATE USING (auth.role() = 'authenticated');
  CREATE POLICY "Enable delete for authenticated users only" ON rooms FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION 
  WHEN others THEN null;
END $$;

-- Enable RLS for form_tokens
ALTER TABLE form_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for form_tokens
DROP POLICY IF EXISTS "Allow public read access to tokens" ON form_tokens;
DROP POLICY IF EXISTS "Allow public insert access to tokens" ON form_tokens;
DROP POLICY IF EXISTS "Allow public update access to tokens" ON form_tokens;

-- Create policies for form_tokens with public access
CREATE POLICY "Allow public read access to tokens"
  ON form_tokens
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to tokens"
  ON form_tokens
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to tokens"
  ON form_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);