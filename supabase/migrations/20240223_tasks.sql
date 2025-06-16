-- Drop existing table if it exists
DROP TABLE IF EXISTS tasks CASCADE;

-- Create simplified tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  workflow_status TEXT NOT NULL DEFAULT 'new',
  start_date TIMESTAMPTZ NOT NULL,
  estimated_duration INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  location TEXT NOT NULL,
  system_type TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'low',
  severity TEXT NOT NULL DEFAULT 'low',
  submitter_info JSONB DEFAULT '{}',
  facility_id TEXT,
  building_id TEXT,
  room_id TEXT
);

-- Add RLS policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create tasks (for external form submissions)
CREATE POLICY "Allow anyone to create tasks" ON tasks
  FOR INSERT TO PUBLIC
  WITH CHECK (true);

-- Allow anyone to view tasks
CREATE POLICY "Allow anyone to view tasks" ON tasks
  FOR SELECT TO PUBLIC
  USING (true); 