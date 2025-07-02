-- Authentication Hierarchy Migration - Part 1: Add Enum Values
-- This must be run first and committed before Part 2

-- Add new role values to existing enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'master_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_master';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'renter'; 