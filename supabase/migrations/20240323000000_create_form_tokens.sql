-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS public.form_tokens;

-- Create form_tokens table
CREATE TABLE public.form_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR NOT NULL UNIQUE,
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX form_tokens_token_idx ON public.form_tokens (token);
CREATE INDEX form_tokens_status_idx ON public.form_tokens (status);

-- Enable Row Level Security
ALTER TABLE public.form_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to form_tokens" ON public.form_tokens;
DROP POLICY IF EXISTS "Allow public insert access to form_tokens" ON public.form_tokens;
DROP POLICY IF EXISTS "Allow public update access to form_tokens" ON public.form_tokens;

-- Create policies for public access
CREATE POLICY "Allow public read access to form_tokens"
    ON public.form_tokens FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert access to form_tokens"
    ON public.form_tokens FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update access to form_tokens"
    ON public.form_tokens FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at ON public.form_tokens;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.form_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 