# Supabase Setup Guide

## Issue: Renter Account Signup Not Working

The signup functionality is not working because the Supabase environment variables are not configured. Here's how to fix it:

## Step 1: Create Environment Variables File

Create a file called `.env.local` in the project root with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mapbox Configuration (for maps)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## Step 2: Get Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Apply Database Migrations

The signup functionality requires proper database schema. Apply these migrations in your Supabase SQL Editor:

### 1. Create User Role Enum
```sql
CREATE TYPE user_role AS ENUM (
  'master_admin',
  'sub_master', 
  'district_approver',
  'site_approver',
  'manager',
  'coordinator',
  'staff',
  'maintenance',
  'vendor',
  'renter'
);
```

### 2. Update Users Table
```sql
-- Add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'renter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS services text[];
```

### 3. Create Organizations Table (if not exists)
```sql
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'renter',
  subtype text,
  name text NOT NULL,
  display_name text,
  tax_id text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  billing_email text,
  street_address text,
  city text,
  state text,
  zip_code text,
  country text DEFAULT 'US',
  requires_insurance boolean DEFAULT false,
  minimum_liability_coverage decimal(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

## Step 4: Test Signup

1. Restart your development server: `npm run dev`
2. Go to the landing page: http://localhost:3000/landing
3. Click "Try For Free" button
4. Select "Individual" account type
5. Fill out the form and submit

## Common Issues

### 1. "User already registered" Error
If you get this error, the user might already exist in Supabase Auth but not in your users table. Check the Supabase dashboard under Authentication > Users.

### 2. Database Permission Errors
Make sure Row Level Security (RLS) policies allow user creation:

```sql
-- Allow users to insert their own records
CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to read their own records  
CREATE POLICY "Users can read their own record" ON users
  FOR SELECT USING (auth.uid() = id);
```

### 3. Email Confirmation Required
Supabase requires email confirmation by default. Check your Supabase project settings under Authentication > Settings and consider disabling "Enable email confirmations" for testing.

## Step 5: Verify Setup

After configuration, you should be able to:
1. Sign up as an individual renter
2. Sign up as an organization
3. See the user created in both Supabase Auth and your users table
4. Sign in with the created account

## Need Help?

If you're still having issues:
1. Check the browser console for JavaScript errors
2. Check the Supabase logs in your dashboard
3. Verify all environment variables are set correctly
4. Make sure the database schema matches the expected structure 