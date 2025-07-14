-- Fix field_blockout_dates table for calendar blockout functionality

-- Create the field_blockout_dates table
CREATE TABLE IF NOT EXISTS public.field_blockout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('weekly', 'monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure end_date >= start_date
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_field_id ON field_blockout_dates(field_id);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_created_by ON field_blockout_dates(created_by);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_date_range ON field_blockout_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_status ON field_blockout_dates(status);

-- Enable RLS for security
ALTER TABLE field_blockout_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to view active blockouts (for availability checking)
CREATE POLICY "Public can view active blockouts"
  ON field_blockout_dates FOR SELECT
  USING (status = 'active');

-- Allow authenticated users to manage blockouts
CREATE POLICY "Authenticated users can manage blockouts"
  ON field_blockout_dates FOR ALL
  USING (auth.role() = 'authenticated');

-- Update trigger function
CREATE OR REPLACE FUNCTION update_field_blockout_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update trigger
CREATE TRIGGER update_field_blockout_dates_updated_at_trigger
  BEFORE UPDATE ON field_blockout_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_field_blockout_dates_updated_at();

-- Verify table creation
SELECT 'field_blockout_dates table created successfully' as status; 