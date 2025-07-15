-- Add missing columns to reservations table
-- These columns are required by the createFieldReservationFromCart function

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS tables_needed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chairs_needed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hvac_needed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS setup_requirements TEXT,
ADD COLUMN IF NOT EXISTS organization TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'reservations'
AND column_name IN ('tables_needed', 'chairs_needed', 'hvac_needed', 'purpose', 'setup_requirements', 'organization')
ORDER BY column_name; 