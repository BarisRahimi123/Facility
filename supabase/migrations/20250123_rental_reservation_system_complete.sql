-- =====================================================
-- RENTAL AND RESERVATION SYSTEM SCHEMA
-- Complete Migration
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organization types
CREATE TYPE IF NOT EXISTS organization_type AS ENUM ('district', 'school', 'renter');
CREATE TYPE IF NOT EXISTS organization_subtype AS ENUM ('individual', 'commercial', 'nonprofit');

-- User roles
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('renter', 'staff', 'site_approver', 'district_approver', 'maintenance', 'support');

-- Reservation statuses
CREATE TYPE IF NOT EXISTS reservation_status AS ENUM ('pending', 'pre_approved', 'approved', 'paid', 'permitted', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS insurance_status AS ENUM ('pending', 'submitted', 'approved', 'deficient', 'waived');
CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pending', 'deposit_paid', 'full_paid', 'invoiced', 'refunded');

-- Work order types
CREATE TYPE IF NOT EXISTS work_order_type AS ENUM ('custodial', 'hvac', 'security', 'setup', 'breakdown', 'cleaning');
CREATE TYPE IF NOT EXISTS work_order_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Rate types
CREATE TYPE IF NOT EXISTS rate_type AS ENUM ('hourly', 'daily', 'flat', 'custom');
CREATE TYPE IF NOT EXISTS fee_type AS ENUM ('rental', 'custodial', 'equipment', 'security', 'other');

-- Organizations table
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

-- Enhance users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'renter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Rate categories
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

-- Enhance fields table
ALTER TABLE fields ADD COLUMN IF NOT EXISTS rate_category_id UUID REFERENCES rate_categories(id);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS minimum_rental_hours INTEGER DEFAULT 1;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS maximum_rental_hours INTEGER;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS setup_time_hours DECIMAL(3,1) DEFAULT 0;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS breakdown_time_hours DECIMAL(3,1) DEFAULT 0;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS requires_custodial BOOLEAN DEFAULT true;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS requires_security BOOLEAN DEFAULT false;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 30;

-- Main reservations table
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_reservations_organization ON reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_facility ON reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at);

-- Sample data
INSERT INTO rate_categories (name, description, rate_type, base_hourly_rate, base_daily_rate, nonprofit_discount_percent)
VALUES 
  ('Standard Field Rental', 'Regular field rental rates', 'hourly', 75.00, 500.00, 20.00),
  ('Premium Field Rental', 'Premium fields with lighting', 'hourly', 100.00, 700.00, 15.00),
  ('Classroom Rental', 'Indoor classroom spaces', 'hourly', 50.00, 350.00, 25.00)
ON CONFLICT DO NOTHING;
