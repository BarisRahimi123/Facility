# Database Fix Guide for Vercel Log Errors

This guide fixes two critical database errors found in your Vercel logs:

1. **PGRST200 Error**: "Could not find a relationship between 'reservations' and 'fields'"
2. **42703 Error**: "column users_1.name does not exist"

## Quick Fix via Supabase Dashboard

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Apply the Fix

Copy and paste this SQL into the editor and click **RUN**:

```sql
-- Fix 1: Add name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Update name column from email if empty
UPDATE users 
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR name = '';

-- Make name column NOT NULL
UPDATE users SET name = COALESCE(name, email, 'Unknown User') WHERE name IS NULL;
ALTER TABLE users ALTER COLUMN name SET NOT NULL;

-- Fix 2: Create reservations table with proper structure
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id),
  facility_id UUID REFERENCES facilities(id),
  user_id UUID REFERENCES users(id),
  
  -- Basic reservation data
  date DATE,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'pending',
  
  -- Contact info
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reservation_slots table (referenced in queries)
CREATE TABLE IF NOT EXISTS reservation_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id),
  date DATE,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON reservations(field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
```

### Step 3: Verify the Fix

Run this verification query:

```sql
-- Verify the fixes
SELECT 
  'users.name column' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'name'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'reservations table' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'reservations'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status
UNION ALL
SELECT 
  'reservations→fields FK' as fix,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'reservations'
    AND kcu.column_name = 'field_id'
  ) THEN 'FIXED ✅' ELSE 'MISSING ❌' END as status;
```

Expected result: All three should show "FIXED ✅"

## What This Fixes

### Error 1: PGRST200 - Reservations/Fields Relationship
- **Problem**: The `reservations` table didn't exist, so queries like `reservations.select('field:fields(name)')` failed
- **Solution**: Created `reservations` table with proper `field_id` foreign key to `fields` table

### Error 2: 42703 - Users.name Column Missing  
- **Problem**: Maintenance queries tried to access `users.name` but the column didn't exist
- **Solution**: Added `name` column to `users` table and populated it from email addresses

## Expected Results

After applying these fixes:

1. **Reservations functionality** will work without PGRST200 errors
2. **Maintenance task queries** will work without 42703 errors  
3. **Field booking system** can now store reservation data
4. **User names** will display properly in maintenance task assignments

## Verification Commands

Test the fixes work by running these in your Next.js app:

```javascript
// Test reservations → fields relationship
const { data, error } = await supabase
  .from('reservations')
  .select('id, field:fields(name)')
  .limit(1);

// Test maintenance tasks with user names
const { data: tasks, error: taskError } = await supabase
  .from('maintenance_tasks')
  .select(`
    title,
    task_assignments(
      user:users!task_assignments_user_id_fkey(name, email)
    )
  `)
  .limit(1);
```

Both queries should now work without errors! 🎉
