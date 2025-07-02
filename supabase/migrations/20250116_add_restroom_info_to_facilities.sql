-- Add restroom information fields to facilities table
-- This enables automatic compliance calculations in facility-level reporting

-- Add restroom information columns to facilities table
ALTER TABLE facilities 
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
ALTER TABLE facilities 
ADD CONSTRAINT chk_fac_boys_toilets_positive CHECK (boys_toilets >= 0),
ADD CONSTRAINT chk_fac_girls_toilets_positive CHECK (girls_toilets >= 0),
ADD CONSTRAINT chk_fac_unisex_toilets_positive CHECK (unisex_toilets >= 0),
ADD CONSTRAINT chk_fac_boys_urinals_positive CHECK (boys_urinals >= 0),
ADD CONSTRAINT chk_fac_girls_urinals_positive CHECK (girls_urinals >= 0),
ADD CONSTRAINT chk_fac_boys_sinks_positive CHECK (boys_sinks >= 0),
ADD CONSTRAINT chk_fac_girls_sinks_positive CHECK (girls_sinks >= 0),
ADD CONSTRAINT chk_fac_unisex_sinks_positive CHECK (unisex_sinks >= 0),
ADD CONSTRAINT chk_fac_boys_restrooms_positive CHECK (boys_restrooms_count >= 0),
ADD CONSTRAINT chk_fac_girls_restrooms_positive CHECK (girls_restrooms_count >= 0),
ADD CONSTRAINT chk_fac_unisex_restrooms_positive CHECK (unisex_restrooms_count >= 0),
ADD CONSTRAINT chk_fac_staff_toilets_positive CHECK (staff_toilets >= 0),
ADD CONSTRAINT chk_fac_staff_sinks_positive CHECK (staff_sinks >= 0),
ADD CONSTRAINT chk_fac_staff_restrooms_positive CHECK (staff_restrooms_count >= 0);

-- Add comments for clarity
COMMENT ON COLUMN facilities.boys_toilets IS 'Number of toilets in boys restrooms across facility';
COMMENT ON COLUMN facilities.girls_toilets IS 'Number of toilets in girls restrooms across facility';
COMMENT ON COLUMN facilities.unisex_toilets IS 'Number of toilets in unisex/family restrooms across facility';
COMMENT ON COLUMN facilities.boys_urinals IS 'Number of urinals in boys restrooms across facility';
COMMENT ON COLUMN facilities.girls_urinals IS 'Number of urinals in girls restrooms across facility (typically 0)';
COMMENT ON COLUMN facilities.boys_sinks IS 'Number of sinks/lavatories in boys restrooms across facility';
COMMENT ON COLUMN facilities.girls_sinks IS 'Number of sinks/lavatories in girls restrooms across facility';
COMMENT ON COLUMN facilities.unisex_sinks IS 'Number of sinks/lavatories in unisex/family restrooms across facility';
COMMENT ON COLUMN facilities.boys_restrooms_count IS 'Total number of boys restroom facilities across campus';
COMMENT ON COLUMN facilities.girls_restrooms_count IS 'Total number of girls restroom facilities across campus';
COMMENT ON COLUMN facilities.unisex_restrooms_count IS 'Total number of unisex/family restroom facilities across campus';
COMMENT ON COLUMN facilities.staff_toilets IS 'Number of toilets in staff/faculty restrooms across facility';
COMMENT ON COLUMN facilities.staff_sinks IS 'Number of sinks in staff/faculty restrooms across facility';
COMMENT ON COLUMN facilities.staff_restrooms_count IS 'Total number of staff/faculty restroom facilities across campus'; 