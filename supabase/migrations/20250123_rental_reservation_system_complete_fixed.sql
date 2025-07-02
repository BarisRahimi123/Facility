-- =====================================================
-- RENTAL AND RESERVATION SYSTEM SCHEMA
-- Complete Migration with Users Table
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist (to allow re-running)
DROP TYPE IF EXISTS organization_type CASCADE;
DROP TYPE IF EXISTS organization_subtype CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS insurance_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS work_order_type CASCADE;
DROP TYPE IF EXISTS work_order_status CASCADE;
DROP TYPE IF EXISTS rate_type CASCADE;
DROP TYPE IF EXISTS fee_type CASCADE;

-- Create types
CREATE TYPE organization_type AS ENUM ('district', 'school', 'renter');
CREATE TYPE organization_subtype AS ENUM ('individual', 'commercial', 'nonprofit');
CREATE TYPE user_role AS ENUM ('renter', 'staff', 'site_approver', 'district_approver', 'maintenance', 'support');
CREATE TYPE reservation_status AS ENUM ('pending', 'pre_approved', 'approved', 'paid', 'permitted', 'completed', 'cancelled');
CREATE TYPE insurance_status AS ENUM ('pending', 'submitted', 'approved', 'deficient', 'waived');
CREATE TYPE payment_status AS ENUM ('pending', 'deposit_paid', 'full_paid', 'invoiced', 'refunded');
CREATE TYPE work_order_type AS ENUM ('custodial', 'hvac', 'security', 'setup', 'breakdown', 'cleaning');
CREATE TYPE work_order_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE rate_type AS ENUM ('hourly', 'daily', 'flat', 'custom');
CREATE TYPE fee_type AS ENUM ('rental', 'custodial', 'equipment', 'security', 'other');

-- Create organizations table first (users will reference it)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type organization_type NOT NULL,
  subtype organization_subtype,
  name TEXT NOT NULL,
  display_name TEXT,
  tax_id TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  billing_email TEXT,
  street_address TEXT,
  city TEXT,
  state VARCHAR(2),
  zip_code VARCHAR(10),
  country VARCHAR(2) DEFAULT 'US',
  insurance_requirements JSONB DEFAULT '{}',
  requires_insurance BOOLEAN DEFAULT true,
  minimum_liability_coverage DECIMAL(10,2),
  auto_approve_internal BOOLEAN DEFAULT false,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  is_active BOOLEAN DEFAULT true
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization_id UUID REFERENCES organizations(id),
  role user_role DEFAULT 'renter',
  permissions JSONB DEFAULT '{}',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rate categories
CREATE TABLE IF NOT EXISTS rate_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  rate_type rate_type NOT NULL DEFAULT 'hourly',
  base_hourly_rate DECIMAL(10,2),
  base_daily_rate DECIMAL(10,2),
  rules JSONB DEFAULT '{}',
  minimum_hours INTEGER DEFAULT 1,
  maximum_hours INTEGER,
  nonprofit_discount_percent DECIMAL(5,2) DEFAULT 0,
  school_discount_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enhance fields table (only if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fields') THEN
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS rate_category_id UUID REFERENCES rate_categories(id);
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS minimum_rental_hours INTEGER DEFAULT 1;
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS maximum_rental_hours INTEGER;
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS setup_time_hours DECIMAL(3,1) DEFAULT 0;
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS breakdown_time_hours DECIMAL(3,1) DEFAULT 0;
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS requires_custodial BOOLEAN DEFAULT true;
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS requires_security BOOLEAN DEFAULT false;
    ALTER TABLE fields ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 30;
  END IF;
END $$;

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_number TEXT UNIQUE,
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  created_by_user_id UUID REFERENCES users(id),
  facility_id UUID REFERENCES facilities(id) NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  insurance_status insurance_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  event_name TEXT NOT NULL,
  event_type TEXT,
  event_description TEXT,
  estimated_attendees INTEGER,
  actual_attendees INTEGER,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  organization_name TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.085,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_percent DECIMAL(5,2) DEFAULT 25,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  additional_services JSONB DEFAULT '[]',
  special_requests TEXT,
  internal_notes TEXT,
  approval_history JSONB DEFAULT '[]',
  pre_approved_at TIMESTAMP WITH TIME ZONE,
  pre_approved_by UUID REFERENCES users(id),
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT
);

-- Create reservation slots table
CREATE TABLE IF NOT EXISTS reservation_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES fields(id) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  quantity INTEGER DEFAULT 1,
  rate_applied DECIMAL(10,2) NOT NULL,
  rate_type rate_type NOT NULL,
  hours DECIMAL(5,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
  ) STORED,
  base_cost DECIMAL(10,2) NOT NULL,
  additional_fees JSONB DEFAULT '{}',
  total_cost DECIMAL(10,2) NOT NULL,
  setup_start_time TIME,
  breakdown_end_time TIME,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional fees table
CREATE TABLE IF NOT EXISTS additional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  fee_type fee_type NOT NULL,
  amount DECIMAL(10,2),
  is_percentage BOOLEAN DEFAULT false,
  percentage_of TEXT,
  is_optional BOOLEAN DEFAULT true,
  is_taxable BOOLEAN DEFAULT true,
  applies_to_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create reservation history table
CREATE TABLE IF NOT EXISTS reservation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility ON reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_reservation_slots_date ON reservation_slots(date);
CREATE INDEX IF NOT EXISTS idx_reservation_slots_field ON reservation_slots(field_id);

-- Insert sample data
INSERT INTO rate_categories (name, description, rate_type, base_hourly_rate, base_daily_rate, nonprofit_discount_percent)
VALUES 
  ('Standard Field Rental', 'Regular field rental rates', 'hourly', 75.00, 500.00, 20.00),
  ('Premium Field Rental', 'Premium fields with lighting', 'hourly', 100.00, 700.00, 15.00),
  ('Classroom Rental', 'Indoor classroom spaces', 'hourly', 50.00, 350.00, 25.00)
ON CONFLICT DO NOTHING;

-- Insert sample additional fees
INSERT INTO additional_fees (name, description, fee_type, amount, is_optional, is_taxable)
VALUES 
  ('Custodial Services', 'Post-event cleaning', 'custodial', 150.00, false, true),
  ('Field Lighting', 'Evening field lighting', 'equipment', 50.00, true, true),
  ('Security Services', 'Event security personnel', 'security', 75.00, true, true),
  ('Equipment Setup', 'Tables, chairs, and equipment setup', 'other', 100.00, true, true)
ON CONFLICT DO NOTHING; 