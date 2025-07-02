-- Create fields table only (simplified version)
CREATE TABLE IF NOT EXISTS public.fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  surface_type TEXT,
  dimensions TEXT,
  area_sq_ft INTEGER,
  capacity INTEGER,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  daily_rate DECIMAL(10,2) DEFAULT 0,
  mapbox_geometry JSONB,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  ada_compliant BOOLEAN DEFAULT false,
  has_lighting BOOLEAN DEFAULT false,
  has_scoreboard BOOLEAN DEFAULT false,
  has_restrooms BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  parking_spots INTEGER,
  status TEXT DEFAULT 'available',
  maintenance_status TEXT DEFAULT 'good',
  instant_booking BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  image_url TEXT,
  image_description TEXT,
  description TEXT,
  rules_and_policies TEXT,
  rental_agreement_template TEXT,
  virtual_tour_url TEXT,
  virtual_tour_description TEXT,
  gallery_images JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Fields are viewable by everyone"
  ON public.fields FOR SELECT USING (true);

CREATE POLICY "Fields are insertable by authenticated users"
  ON public.fields FOR INSERT WITH CHECK (true);

CREATE POLICY "Fields are updatable by authenticated users"
  ON public.fields FOR UPDATE USING (true);

CREATE POLICY "Fields are deletable by authenticated users"
  ON public.fields FOR DELETE USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_fields_facility_id ON public.fields(facility_id); 