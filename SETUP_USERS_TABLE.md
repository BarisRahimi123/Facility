# Setup Users Table for People Page

## Problem
The People page shows "Database Setup Required" because the `users` and `organizations` tables don't exist in your Supabase database.

## Solution: Create the Tables Manually

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project (ahntaamtsypranvnofxy)

### Step 2: Navigate to SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**

### Step 3: Run the Table Creation Script
Copy and paste this SQL code:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master_admin', 'sub_admin', 'staff', 'manager', 'coordinator', 'vendor', 'renter', 'district_approver', 'site_approver')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  department TEXT,
  position TEXT,
  company TEXT,
  services TEXT[],
  organization_id UUID,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  is_active BOOLEAN DEFAULT true,
  services TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT users_organization_id_fkey 
FOREIGN KEY (organization_id) 
REFERENCES organizations(id) 
ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_organizations_type ON organizations(type);

-- Insert master admin user
INSERT INTO users (email, full_name, role, is_active)
VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin', true)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'master_admin',
  is_active = true;

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON organizations TO anon;
```

### Step 4: Execute the Query
1. Click **Run** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)
2. You should see "Success. No rows returned"

### Step 5: Verify the Tables
1. Go to **Table Editor** in the left sidebar
2. You should now see:
   - `users` table with your master admin account
   - `organizations` table (empty but ready)

### Step 6: Test the People Page
1. Go back to your application
2. Refresh the People page
3. The "Database Setup Required" message should be gone
4. You should see the People Management interface

## Alternative: Get Correct Environment Variables

If the above doesn't work, you need to fix your environment variables:

### Get Fresh Keys from Supabase
1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy these values EXACTLY (make sure they're on single lines):
   - **Project URL**: Copy the entire URL
   - **anon public**: Copy the entire key (starts with `eyJ...`)
   - **service_role secret**: Copy the entire key (starts with `eyJ...`)

### Update .env.local
Replace your current `.env.local` with these exact values (no line breaks!):

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here_on_one_line
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here_on_one_line
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=info@facilitycore.ai
SENDGRID_FROM_NAME=FacilityCore
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Restart the Server
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## Success Indicators
✅ People page loads without "Database Setup Required"
✅ You can see tabs for Staff, Manager, Coordinator, etc.
✅ Add User and Invite User buttons are visible
✅ Your master admin account (85baris@gmail.com) exists in the system
