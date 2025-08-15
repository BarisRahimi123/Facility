-- Create maintenance_issue_reports table
CREATE TABLE IF NOT EXISTS public.maintenance_issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
  qr_code_id UUID,
  
  -- Issue details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'electrical', 'plumbing', 'hvac', 'structural', 'safety',
    'cleaning', 'pest_control', 'landscaping', 'equipment',
    'security', 'other'
  )),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Reporter information
  reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reporter_name VARCHAR(255) NOT NULL,
  reporter_email VARCHAR(255) NOT NULL,
  reporter_phone VARCHAR(50) NOT NULL,
  
  -- Location information
  location_type VARCHAR(50) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  location_details TEXT,
  
  -- Media
  images JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'acknowledged', 'assigned', 'in_progress',
    'on_hold', 'resolved', 'closed', 'cancelled'
  )),
  task_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  -- Additional data
  metadata JSONB,
  resolution_notes TEXT,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_facility_id ON public.maintenance_issue_reports(facility_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_building_id ON public.maintenance_issue_reports(building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_room_id ON public.maintenance_issue_reports(room_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_field_id ON public.maintenance_issue_reports(field_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_status ON public.maintenance_issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_priority ON public.maintenance_issue_reports(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_created_at ON public.maintenance_issue_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_issue_reports_reported_by ON public.maintenance_issue_reports(reported_by);

-- Add comments for documentation
COMMENT ON TABLE public.maintenance_issue_reports IS 'Stores maintenance issue reports submitted by users';
COMMENT ON COLUMN public.maintenance_issue_reports.category IS 'Type of maintenance issue';
COMMENT ON COLUMN public.maintenance_issue_reports.priority IS 'Urgency level of the issue';
COMMENT ON COLUMN public.maintenance_issue_reports.status IS 'Current status of the issue report';

-- Create RLS policies (disabled for now to ensure it works)
ALTER TABLE public.maintenance_issue_reports DISABLE ROW LEVEL SECURITY;

-- Create a function to log issue activities (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.log_issue_activity(
  p_issue_id UUID,
  p_user_id UUID,
  p_action VARCHAR,
  p_description TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- This is a placeholder function
  -- You can implement actual logging to an activity table if needed
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON public.maintenance_issue_reports TO authenticated;
GRANT ALL ON public.maintenance_issue_reports TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully created maintenance_issue_reports table';
END $$;
