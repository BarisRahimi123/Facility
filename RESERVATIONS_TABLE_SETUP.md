# Reservations Table Setup Guide

## Issue
The error "Could not find the 'chairs_needed' column of 'reservations' in the schema cache" occurs because the reservations table doesn't exist in your database.

## Quick Fix

1. **Go to your Supabase Dashboard**
   - Navigate to the SQL Editor

2. **Run this SQL to create the reservations table:**

```sql
-- Create reservations table for field bookings
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Booking time details
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  
  -- Pricing
  hourly_rate DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  
  -- Event details
  purpose TEXT,
  setup_requirements TEXT,
  tables_needed INTEGER DEFAULT 0,
  chairs_needed INTEGER DEFAULT 0,
  hvac_needed BOOLEAN DEFAULT false,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  organization TEXT,
  
  -- Recurring details
  recurring_type TEXT CHECK (recurring_type IN (NULL, 'weekly', 'monthly', 'yearly')),
  recurring_occurrences INTEGER,
  recurring_index INTEGER,
  
  -- Administrative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_field_id ON public.reservations(field_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility_id ON public.reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- Disable RLS for now (enable later for production)
ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
```

3. **Verify the table was created:**
   - Run `SELECT * FROM reservations LIMIT 1;` to confirm

## Alternative: Use the Complete Migration

If you want the full rental/reservation system with all features:

1. Copy the contents of: `scripts/apply-reservations-table.sql`
2. Run it in Supabase SQL Editor

This includes:
- Full reservations table with all columns
- Proper constraints and indexes
- Row Level Security policies
- Exclusion constraints to prevent double-booking

## Troubleshooting

### If you still get column errors:
1. Clear your browser cache
2. Restart your Next.js development server
3. Check Supabase logs for any errors

### Common Issues:
- **Foreign key errors**: Make sure `fields`, `facilities`, and `users` tables exist
- **Permission errors**: Ensure your database user has CREATE TABLE permissions
- **Schema cache errors**: Wait a few seconds after creating the table for Supabase to update its cache

## Next Steps

After creating the table:
1. Test the reservation flow again
2. Reservations should save successfully
3. Check the user dashboard to see saved reservations

## For Production

Remember to:
1. Enable Row Level Security (RLS)
2. Add proper policies for data access
3. Set up regular backups
4. Monitor table growth and performance 