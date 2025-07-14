# URGENT: Fix Facility Photos Error

## Current Error
```
Error loading facility photos: Error: {code: "42P01", details: Null, hint: ..., message: ...}
Error uploading photo: Error: {statusCode: "404", error: ..., message: ...}
```

## Quick Fix (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar

### Step 2: Apply the Migration
1. Copy the **ENTIRE** content from `scripts/apply-facility-photos-migration.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute

### Step 3: Verify Success
After running the SQL, you should see:
- ✅ "Table created successfully" with `table_exists: true`
- ✅ "Storage bucket created successfully" with `bucket_exists: YES`

### Step 4: Test the Fix
1. Go back to your facility photos tab
2. Refresh the page
3. The error should be gone and you should be able to upload photos

## Alternative: Manual Steps

If you prefer to see exactly what's being created:

### Create Table:
```sql
CREATE TABLE facility_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Create Storage Bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('facility-photos', 'facility-photos', true);
```

### Add Basic Permissions:
```sql
ALTER TABLE facility_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on facility_photos" ON facility_photos
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
```

## Expected Result
After applying this fix:
- ✅ No more "42P01" errors
- ✅ No more "404" errors
- ✅ Photo upload works
- ✅ Photo viewing works
- ✅ Photo management works

## Need Help?
If you're still getting errors after applying the migration, check:
1. Did all SQL commands run successfully?
2. Are there any error messages in the SQL Editor?
3. Does the `facilities` table exist? (facility_photos references it)

The migration includes verification queries at the end to confirm everything was created correctly. 