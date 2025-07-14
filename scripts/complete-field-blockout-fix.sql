-- Complete fix for field calendar blockout functionality
-- Run this entire script in your Supabase SQL Editor

-- 1. Create the field_blockout_dates table
CREATE TABLE IF NOT EXISTS public.field_blockout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_field_id ON public.field_blockout_dates(field_id);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_dates ON public.field_blockout_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_status ON public.field_blockout_dates(status);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_created_by ON public.field_blockout_dates(created_by);

-- 3. Disable RLS for testing (you can enable it later)
ALTER TABLE public.field_blockout_dates DISABLE ROW LEVEL SECURITY;

-- 4. Verify the table was created
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'field_blockout_dates'
) as table_created; 