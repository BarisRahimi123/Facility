-- Create form_tokens table
CREATE TABLE IF NOT EXISTS form_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Create an index on the token column for faster lookups
CREATE INDEX IF NOT EXISTS form_tokens_token_idx ON form_tokens(token);

-- Add RLS policies
ALTER TABLE form_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to validate tokens
CREATE POLICY "Allow anyone to validate tokens" ON form_tokens
  FOR SELECT USING (true);

-- Only allow authenticated users to create tokens
CREATE POLICY "Allow authenticated users to create tokens" ON form_tokens
  FOR INSERT TO authenticated USING (auth.uid() = created_by);

-- Only allow token creators to update their tokens
CREATE POLICY "Allow token creators to update their tokens" ON form_tokens
  FOR UPDATE TO authenticated USING (auth.uid() = created_by); 