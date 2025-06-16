-- Create tables for plans management

-- Plans folder table to organize plans
CREATE TABLE IF NOT EXISTS public.plans_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discipline TEXT NOT NULL,
  phase TEXT NOT NULL,
  item_count INT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plans table to store plan metadata and file references
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES public.plans_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sheet_number TEXT NOT NULL,
  revision TEXT NOT NULL,
  scale TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT,
  url TEXT,
  thumbnail_url TEXT,
  building_refs JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  version TEXT NOT NULL DEFAULT '1.0',
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS plans_folder_id_idx ON public.plans(folder_id);
CREATE INDEX IF NOT EXISTS plans_uploaded_by_idx ON public.plans(uploaded_by);

-- RLS Policies
ALTER TABLE public.plans_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view folders
CREATE POLICY "Anyone can view folders"
  ON public.plans_folders
  FOR SELECT
  USING (true);

-- Only authenticated users can create folders
CREATE POLICY "Authenticated users can create folders"
  ON public.plans_folders
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON public.plans_folders
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON public.plans_folders
  FOR DELETE
  USING (auth.uid() = created_by);

-- Everyone can view plans
CREATE POLICY "Anyone can view plans"
  ON public.plans
  FOR SELECT
  USING (true);

-- Only authenticated users can insert plans
CREATE POLICY "Authenticated users can create plans"
  ON public.plans
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own plans
CREATE POLICY "Users can update their own plans"
  ON public.plans
  FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- Users can delete their own plans
CREATE POLICY "Users can delete their own plans"
  ON public.plans
  FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_folders_updated_at
BEFORE UPDATE ON public.plans_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('plans', 'Plans Storage', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'Thumbnails Storage', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view plan files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'plans');

CREATE POLICY "Anyone can view thumbnails"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload plan files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'plans' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload thumbnails"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own uploads"
  ON storage.objects
  FOR UPDATE
  USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects
  FOR DELETE
  USING (auth.uid() = owner); 