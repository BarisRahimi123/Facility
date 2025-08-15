# 🚨 URGENT: Enable Issue Reporting on Maintenance Page

## Problem
Issue submission is not working because the `maintenance_issue_reports` table doesn't exist in your database.

## Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Copy & Paste This SQL
Copy ALL of the SQL below and paste it into the SQL Editor:

```sql
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
  
  -- Reporter information (NOW REQUIRED)
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
CREATE INDEX IF NOT EXISTS idx_issue_reports_facility ON public.maintenance_issue_reports(facility_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_building ON public.maintenance_issue_reports(building_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON public.maintenance_issue_reports(status);
CREATE INDEX IF NOT EXISTS idx_issue_reports_priority ON public.maintenance_issue_reports(priority);
CREATE INDEX IF NOT EXISTS idx_issue_reports_created ON public.maintenance_issue_reports(created_at DESC);

-- Disable RLS for now (enable later with proper policies)
ALTER TABLE public.maintenance_issue_reports DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.maintenance_issue_reports TO authenticated;
GRANT ALL ON public.maintenance_issue_reports TO service_role;

-- Create placeholder function for activity logging
CREATE OR REPLACE FUNCTION public.log_issue_activity(
  p_issue_id UUID,
  p_user_id UUID,
  p_action VARCHAR,
  p_description TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Placeholder for activity logging
  -- You can implement actual logging later
  RETURN;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Run the SQL
1. Click the **Run** button
2. You should see "Success. No rows returned"

### Step 4: Verify It Worked
Still in SQL Editor, run this query to verify:

```sql
SELECT COUNT(*) FROM maintenance_issue_reports;
```

If it returns `0` (zero), the table was created successfully!

## ✅ Done!
Now you can:
- Click "Share Issue Form" on the maintenance page
- Submit issues with required contact information
- Issues will be saved to the database
- View submitted issues in the maintenance dashboard

## 🎉 Features Now Working:
- ✅ Issue submission form
- ✅ Required contact information (name, email, phone)
- ✅ Priority and category selection
- ✅ Location selection (facility, building, room, field)
- ✅ Issue tracking and status management
- ✅ Image upload preparation (ready for future implementation)

## Troubleshooting
If you get an error about foreign keys:
- Make sure your `facilities`, `buildings`, `rooms`, and `fields` tables exist
- If `fields` table doesn't exist, remove the `field_id` line from the SQL

If you get permission errors:
- Make sure you're using the service role key in your `.env.local`
- Check that your database user has CREATE TABLE permissions
