-- SIMPLIFIED SMS Consent System for Twilio
-- Run this in Supabase SQL Editor

-- Step 1: Create basic consent table
CREATE TABLE IF NOT EXISTS sms_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'pending',
  consent_source TEXT NOT NULL,
  consent_granted_at TIMESTAMP WITH TIME ZONE,
  consent_revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  consent_text TEXT NOT NULL,
  opt_in_method TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Step 2: Create notification preferences table
CREATE TABLE IF NOT EXISTS sms_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_record_id UUID REFERENCES sms_consent_records(id) ON DELETE CASCADE,
  issue_submitted BOOLEAN DEFAULT false,
  issue_assigned BOOLEAN DEFAULT true,
  issue_resolved BOOLEAN DEFAULT false,
  task_due_tomorrow BOOLEAN DEFAULT true,
  task_due_today BOOLEAN DEFAULT true,
  task_overdue BOOLEAN DEFAULT true,
  reservation_requested BOOLEAN DEFAULT false,
  reservation_approved BOOLEAN DEFAULT true,
  reservation_rejected BOOLEAN DEFAULT true,
  reservation_reminder BOOLEAN DEFAULT true,
  maintenance_scheduled BOOLEAN DEFAULT true,
  contractor_invited BOOLEAN DEFAULT true,
  promotional_messages BOOLEAN DEFAULT false,
  facility_announcements BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create audit log table
CREATE TABLE IF NOT EXISTS sms_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  phone_number TEXT NOT NULL,
  consent_record_id UUID REFERENCES sms_consent_records(id),
  message_type TEXT NOT NULL,
  message_content TEXT NOT NULL,
  twilio_message_sid TEXT,
  send_attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  send_successful BOOLEAN DEFAULT false,
  delivery_status TEXT,
  error_message TEXT,
  consent_verified_at_send BOOLEAN NOT NULL DEFAULT false,
  consent_status_at_send TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create opt-out requests table
CREATE TABLE IF NOT EXISTS sms_opt_out_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  consent_record_id UUID REFERENCES sms_consent_records(id),
  opt_out_method TEXT NOT NULL,
  opt_out_message TEXT,
  twilio_message_sid TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_sms_consent_user_id ON sms_consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_consent_phone ON sms_consent_records(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_consent_status ON sms_consent_records(consent_status);
CREATE INDEX IF NOT EXISTS idx_sms_preferences_user_id ON sms_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_audit_user_id ON sms_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_optout_phone ON sms_opt_out_requests(phone_number);

-- Step 6: Add columns to users table (if they don't exist)
DO $$ 
BEGIN
  -- Add sms_consent_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' 
                 AND column_name = 'sms_consent_status') THEN
    ALTER TABLE users ADD COLUMN sms_consent_status TEXT DEFAULT 'pending';
  END IF;
  
  -- Add sms_consent_granted_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' 
                 AND column_name = 'sms_consent_granted_at') THEN
    ALTER TABLE users ADD COLUMN sms_consent_granted_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add notification_preferences column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' 
                 AND column_name = 'notification_preferences') THEN
    ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}';
  END IF;
END $$;

-- Step 7: Grant permissions
GRANT ALL ON sms_consent_records TO postgres;
GRANT ALL ON sms_notification_preferences TO postgres;
GRANT ALL ON sms_audit_log TO postgres;
GRANT ALL ON sms_opt_out_requests TO postgres;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'SMS Consent System tables created successfully!';
END $$;










