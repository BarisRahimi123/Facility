-- Create building_systems table
CREATE TABLE IF NOT EXISTS building_systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  system_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  manufacturer VARCHAR(255),
  installation_date DATE,
  warranty_expiry DATE,
  condition VARCHAR(50),
  maintenance_schedule VARCHAR(50),
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  status VARCHAR(50) DEFAULT 'operational',
  specifications JSONB,
  maintenance_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create renovations table
CREATE TABLE IF NOT EXISTS renovations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  scope_of_work TEXT NOT NULL,
  square_footage_affected INTEGER,
  start_date DATE,
  completion_date DATE,
  status VARCHAR(50) DEFAULT 'planning',
  budget DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  contractor_name VARCHAR(255),
  contractor_contact VARCHAR(255),
  permit_numbers TEXT,
  permit_issue_date DATE,
  inspection_dates TEXT,
  inspection_results TEXT,
  notes TEXT,
  funding_source VARCHAR(100),
  dsa_approval_status VARCHAR(50),
  inspector_of_record JSONB,
  change_orders JSONB,
  estimated_budget DECIMAL(12, 2),
  final_cost DECIMAL(12, 2),
  contractor_details JSONB,
  architect_firm JSONB,
  project_manager JSONB,
  warranties JSONB,
  maintenance_plan TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_building_systems_building_id ON building_systems(building_id);
CREATE INDEX idx_building_systems_system_type ON building_systems(system_type);
CREATE INDEX idx_building_systems_status ON building_systems(status);

CREATE INDEX idx_renovations_building_id ON renovations(building_id);
CREATE INDEX idx_renovations_status ON renovations(status);
CREATE INDEX idx_renovations_start_date ON renovations(start_date);

-- Add comments for documentation
COMMENT ON TABLE building_systems IS 'Stores information about building systems (HVAC, electrical, plumbing, etc.)';
COMMENT ON TABLE renovations IS 'Stores renovation history and projects for buildings';

-- Grant permissions (if using Row Level Security)
ALTER TABLE building_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be refined later)
CREATE POLICY "Allow all operations on building_systems" ON building_systems
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on renovations" ON renovations
  FOR ALL USING (true); 