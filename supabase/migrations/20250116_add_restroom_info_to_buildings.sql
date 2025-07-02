-- Add restroom information fields to buildings table
-- This enables automatic compliance calculations in the building compliance calculator

-- Add restroom information columns to buildings table
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS boys_toilets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS girls_toilets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unisex_toilets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boys_urinals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS girls_urinals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boys_sinks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS girls_sinks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unisex_sinks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS boys_restrooms_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS girls_restrooms_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unisex_restrooms_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_toilets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_sinks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS staff_restrooms_count INTEGER DEFAULT 0;

-- Add constraints to ensure positive values
ALTER TABLE buildings 
ADD CONSTRAINT chk_boys_toilets_positive CHECK (boys_toilets >= 0),
ADD CONSTRAINT chk_girls_toilets_positive CHECK (girls_toilets >= 0),
ADD CONSTRAINT chk_unisex_toilets_positive CHECK (unisex_toilets >= 0),
ADD CONSTRAINT chk_boys_urinals_positive CHECK (boys_urinals >= 0),
ADD CONSTRAINT chk_girls_urinals_positive CHECK (girls_urinals >= 0),
ADD CONSTRAINT chk_boys_sinks_positive CHECK (boys_sinks >= 0),
ADD CONSTRAINT chk_girls_sinks_positive CHECK (girls_sinks >= 0),
ADD CONSTRAINT chk_unisex_sinks_positive CHECK (unisex_sinks >= 0),
ADD CONSTRAINT chk_boys_restrooms_positive CHECK (boys_restrooms_count >= 0),
ADD CONSTRAINT chk_girls_restrooms_positive CHECK (girls_restrooms_count >= 0),
ADD CONSTRAINT chk_unisex_restrooms_positive CHECK (unisex_restrooms_count >= 0),
ADD CONSTRAINT chk_staff_toilets_positive CHECK (staff_toilets >= 0),
ADD CONSTRAINT chk_staff_sinks_positive CHECK (staff_sinks >= 0),
ADD CONSTRAINT chk_staff_restrooms_positive CHECK (staff_restrooms_count >= 0);

-- Add comments for clarity
COMMENT ON COLUMN buildings.boys_toilets IS 'Number of toilets in boys restrooms';
COMMENT ON COLUMN buildings.girls_toilets IS 'Number of toilets in girls restrooms';
COMMENT ON COLUMN buildings.unisex_toilets IS 'Number of toilets in unisex/family restrooms';
COMMENT ON COLUMN buildings.boys_urinals IS 'Number of urinals in boys restrooms';
COMMENT ON COLUMN buildings.girls_urinals IS 'Number of urinals in girls restrooms (typically 0)';
COMMENT ON COLUMN buildings.boys_sinks IS 'Number of sinks/lavatories in boys restrooms';
COMMENT ON COLUMN buildings.girls_sinks IS 'Number of sinks/lavatories in girls restrooms';
COMMENT ON COLUMN buildings.unisex_sinks IS 'Number of sinks/lavatories in unisex/family restrooms';
COMMENT ON COLUMN buildings.boys_restrooms_count IS 'Total number of boys restroom facilities';
COMMENT ON COLUMN buildings.girls_restrooms_count IS 'Total number of girls restroom facilities';
COMMENT ON COLUMN buildings.unisex_restrooms_count IS 'Total number of unisex/family restroom facilities';
COMMENT ON COLUMN buildings.staff_toilets IS 'Number of toilets in staff/faculty restrooms';
COMMENT ON COLUMN buildings.staff_sinks IS 'Number of sinks in staff/faculty restrooms';
COMMENT ON COLUMN buildings.staff_restrooms_count IS 'Total number of staff/faculty restroom facilities'; 