# Facility Photos Setup Guide

## Problem
The facility photos tab is showing a server error with code "42P01" which means the `facility_photos` table doesn't exist in the database.

## Solution

### Step 1: Apply the Migration
The migration file already exists but hasn't been applied to the database.

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250115_create_facility_photos_table.sql`
4. Execute the SQL commands

### Step 2: Verify the Setup
After applying the migration, run this SQL to verify everything is set up correctly:

```sql
-- Check if facility_photos table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'facility_photos'
) AS table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facility_photos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if storage bucket exists
SELECT id, name, public
FROM storage.buckets 
WHERE id = 'facility-photos';
```

### What the Migration Creates

1. **facility_photos table** with columns:
   - id (UUID, primary key)
   - facility_id (UUID, foreign key to facilities)
   - url (TEXT, public URL of the photo)
   - storage_path (TEXT, path in storage bucket)
   - file_name (TEXT, original filename)
   - file_type (TEXT, MIME type)
   - file_size (INTEGER, file size in bytes)
   - description (TEXT, optional description)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. **Storage bucket** named 'facility-photos' for storing image files

3. **RLS policies** for secure access to photos and storage

4. **Indexes** for better query performance

5. **Triggers** to automatically update the updated_at timestamp

### Expected Result
After applying the migration:
- The facility photos tab will load without errors
- Users can upload, view, edit, and delete facility photos
- Photos are stored securely in Supabase Storage
- All photo metadata is tracked in the database

### Troubleshooting
If you still get errors after applying the migration:
1. Check that all SQL commands executed successfully
2. Verify the storage bucket was created
3. Ensure RLS policies are in place
4. Check that the facilities table exists (facility_photos references it) 