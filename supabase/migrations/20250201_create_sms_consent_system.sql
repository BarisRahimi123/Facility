-- SMS Consent Collection System for Twilio TCPA Compliance
-- This migration creates tables to track explicit user consent for SMS communications

-- Create enum for consent status
CREATE TYPE sms_consent_status AS ENUM ('pending', 'active', 'revoked', 'expired');

-- Create enum for consent source
CREATE TYPE sms_consent_source AS ENUM (
  'website_form',
  'checkout',
  'account_signup',
  'mobile_app',
  'in_person',
  'phone_verbal',
  'import'
);

-- Create enum for SMS message types users can opt into
CREATE TYPE sms_message_type AS ENUM (
  'marketing',
  'transactional',
  'alerts',
  'reminders',
  'all'
);

-- Main SMS consent records table
CREATE TABLE IF NOT EXISTS sms_consent_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User information
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  
  -- Consent details
  consent_status sms_consent_status NOT NULL DEFAULT 'active',
  consent_source sms_consent_source NOT NULL,
  message_types sms_message_type[] NOT NULL DEFAULT ARRAY['all']::sms_message_type[],
  
  -- Consent text shown to user
  consent_text TEXT NOT NULL,
  terms_version VARCHAR(50),
  privacy_policy_version VARCHAR(50),
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,
  page_url TEXT NOT NULL,
  
  -- Double opt-in verification
  verification_token VARCHAR(255),
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_active_consent UNIQUE (phone_number, consent_status) 
    WHERE consent_status = 'active'
);

-- Create indexes for performance
CREATE INDEX idx_sms_consent_phone ON sms_consent_records(phone_number);
CREATE INDEX idx_sms_consent_user ON sms_consent_records(user_id);
CREATE INDEX idx_sms_consent_status ON sms_consent_records(consent_status);
CREATE INDEX idx_sms_consent_verified ON sms_consent_records(verified_at);
CREATE INDEX idx_sms_consent_created ON sms_consent_records(created_at DESC);

-- SMS opt-out/opt-in history table
CREATE TABLE IF NOT EXISTS sms_consent_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_record_id UUID REFERENCES sms_consent_records(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'opt_in', 'opt_out', 'verify', 'update'
  previous_status sms_consent_status,
  new_status sms_consent_status,
  source VARCHAR(100), -- 'sms_reply', 'web_form', 'api', 'admin', etc.
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_history_phone ON sms_consent_history(phone_number);
CREATE INDEX idx_sms_history_created ON sms_consent_history(created_at DESC);

-- SMS message send log (for compliance tracking)
CREATE TABLE IF NOT EXISTS sms_message_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_record_id UUID REFERENCES sms_consent_records(id),
  phone_number VARCHAR(20) NOT NULL,
  message_type sms_message_type NOT NULL,
  message_content TEXT NOT NULL,
  twilio_message_sid VARCHAR(255),
  status VARCHAR(50),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_log_phone ON sms_message_log(phone_number);
CREATE INDEX idx_sms_log_sent ON sms_message_log(sent_at DESC);

-- Keyword-based opt-in tracking (for SMS keywords like "START", "STOP")
CREATE TABLE IF NOT EXISTS sms_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'opt_in', 'opt_out', 'help'
  response_message TEXT NOT NULL,
  campaign_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_keyword UNIQUE (keyword) WHERE is_active = true
);

-- Insert default keywords
INSERT INTO sms_keywords (keyword, action, response_message) VALUES
  ('START', 'opt_in', 'You have successfully subscribed to SMS alerts from FacilityCore. Reply STOP to unsubscribe. Msg & data rates may apply.'),
  ('YES', 'opt_in', 'You have successfully subscribed to SMS alerts from FacilityCore. Reply STOP to unsubscribe. Msg & data rates may apply.'),
  ('UNSTOP', 'opt_in', 'You have successfully resubscribed to SMS alerts from FacilityCore. Reply STOP to unsubscribe. Msg & data rates may apply.'),
  ('STOP', 'opt_out', 'You have been unsubscribed from FacilityCore SMS alerts. Reply START to resubscribe.'),
  ('STOPALL', 'opt_out', 'You have been unsubscribed from all FacilityCore SMS alerts. Reply START to resubscribe.'),
  ('UNSUBSCRIBE', 'opt_out', 'You have been unsubscribed from FacilityCore SMS alerts. Reply START to resubscribe.'),
  ('CANCEL', 'opt_out', 'You have been unsubscribed from FacilityCore SMS alerts. Reply START to resubscribe.'),
  ('END', 'opt_out', 'You have been unsubscribed from FacilityCore SMS alerts. Reply START to resubscribe.'),
  ('QUIT', 'opt_out', 'You have been unsubscribed from FacilityCore SMS alerts. Reply START to resubscribe.'),
  ('HELP', 'help', 'FacilityCore: Get maintenance alerts & updates via SMS. Reply STOP to unsubscribe. For support, visit facilitycore.ai/help'),
  ('INFO', 'help', 'FacilityCore: Get maintenance alerts & updates via SMS. Reply STOP to unsubscribe. For support, visit facilitycore.ai/help');

-- Function to check if a phone number has active consent
CREATE OR REPLACE FUNCTION has_sms_consent(p_phone_number VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM sms_consent_records 
    WHERE phone_number = p_phone_number 
      AND consent_status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
      AND verified_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to record consent action in history
CREATE OR REPLACE FUNCTION log_sms_consent_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.consent_status != NEW.consent_status THEN
      INSERT INTO sms_consent_history (
        consent_record_id,
        phone_number,
        action,
        previous_status,
        new_status,
        source,
        created_at
      ) VALUES (
        NEW.id,
        NEW.phone_number,
        CASE 
          WHEN NEW.consent_status = 'active' THEN 'opt_in'
          WHEN NEW.consent_status = 'revoked' THEN 'opt_out'
          ELSE 'update'
        END,
        OLD.consent_status,
        NEW.consent_status,
        'system',
        NOW()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for consent history logging
CREATE TRIGGER sms_consent_history_trigger
  AFTER UPDATE ON sms_consent_records
  FOR EACH ROW
  EXECUTE FUNCTION log_sms_consent_action();

-- Create RLS policies (if using Supabase Auth)
ALTER TABLE sms_consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_message_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent records
CREATE POLICY "Users can view own SMS consent" ON sms_consent_records
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own consent
CREATE POLICY "Users can update own SMS consent" ON sms_consent_records
  FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all consent records
CREATE POLICY "Admins can view all SMS consent" ON sms_consent_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_role IN ('master_admin', 'sub_admin')
    )
  );

-- Add helpful comments
COMMENT ON TABLE sms_consent_records IS 'Stores explicit SMS consent records for TCPA compliance';
COMMENT ON COLUMN sms_consent_records.consent_text IS 'The exact text shown to the user when they consented';
COMMENT ON COLUMN sms_consent_records.verified_at IS 'Timestamp when double opt-in was confirmed';
COMMENT ON COLUMN sms_consent_records.page_url IS 'The URL where consent was collected - required for Twilio verification';