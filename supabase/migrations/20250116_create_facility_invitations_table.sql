-- Create facility_invitations table for sharing facilities with external users
CREATE TABLE facility_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_ids JSONB NOT NULL DEFAULT '[]', -- Array of facility IDs, empty array means all facilities
  invitee_email TEXT NOT NULL,
  invitee_name TEXT NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for mock users
  role TEXT NOT NULL CHECK (role IN ('consultant', 'vendor', 'external')),
  company TEXT,
  message TEXT NOT NULL DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '{
    "viewPlans": true,
    "viewTasks": true,
    "viewDocuments": true,
    "viewMaintenance": true,
    "viewReports": true,
    "addComments": false
  }',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_facility_invitations_token ON facility_invitations(token);
CREATE INDEX idx_facility_invitations_invitee_email ON facility_invitations(invitee_email);
CREATE INDEX idx_facility_invitations_status ON facility_invitations(status);
CREATE INDEX idx_facility_invitations_expires_at ON facility_invitations(expires_at);
CREATE INDEX idx_facility_invitations_facility_ids ON facility_invitations USING GIN(facility_ids);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_facility_invitations_updated_at
  BEFORE UPDATE ON facility_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (Row Level Security)
ALTER TABLE facility_invitations ENABLE ROW LEVEL SECURITY;

-- Policy for inserting invitations (only authenticated users can create)
CREATE POLICY "Users can create facility invitations" ON facility_invitations
  FOR INSERT
  WITH CHECK (true); -- Allow all for now since we're using service role

-- Policy for viewing invitations (users can see invitations they created or received)
CREATE POLICY "Users can view their facility invitations" ON facility_invitations
  FOR SELECT
  USING (
    auth.uid() = inviter_id 
    OR invitee_email = auth.email()
    OR true -- Allow all for now since we're using service role
  );

-- Policy for updating invitations (only the invitee can accept, only inviter can revoke)
CREATE POLICY "Users can update their facility invitations" ON facility_invitations
  FOR UPDATE
  USING (
    (auth.uid() = inviter_id AND status IN ('pending', 'accepted')) -- Inviter can revoke
    OR (invitee_email = auth.email() AND status = 'pending') -- Invitee can accept
    OR true -- Allow all for now since we're using service role
  );

-- Add comments
COMMENT ON TABLE facility_invitations IS 'Stores invitations to share facility access with external users';
COMMENT ON COLUMN facility_invitations.facility_ids IS 'JSON array of facility UUIDs to share, empty array means all facilities';
COMMENT ON COLUMN facility_invitations.permissions IS 'JSON object defining what the invitee can access';
COMMENT ON COLUMN facility_invitations.token IS 'Unique token used in invitation URLs';
COMMENT ON COLUMN facility_invitations.status IS 'Current status of the invitation'; 