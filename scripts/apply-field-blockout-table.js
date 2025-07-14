const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFieldBlockoutMigration() {
  console.log('Creating field_blockout_dates table...');

  try {
    // Create the field_blockout_dates table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.field_blockout_dates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
          created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          reason TEXT NOT NULL,
          description TEXT,
          recurring BOOLEAN DEFAULT FALSE,
          recurring_pattern TEXT CHECK (recurring_pattern IN ('weekly', 'monthly', 'yearly')),
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
      `
    });

    if (tableError) {
      // If exec_sql doesn't exist, try direct SQL
      const { error: directError } = await supabase.from('_sql').select().single();
      
      // Since we can't execute raw SQL from the client, let's provide a more helpful message
      console.error('\n❌ Cannot create table programmatically from Node.js');
      console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:');
      console.log('\n----------------------------------------');
      console.log(`
CREATE TABLE IF NOT EXISTS public.field_blockout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('weekly', 'monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_field_id ON public.field_blockout_dates(field_id);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_dates ON public.field_blockout_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_status ON public.field_blockout_dates(status);

-- Enable Row Level Security
ALTER TABLE public.field_blockout_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active field blockouts" ON public.field_blockout_dates
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create field blockouts" ON public.field_blockout_dates
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own field blockouts" ON public.field_blockout_dates
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own field blockouts" ON public.field_blockout_dates
  FOR DELETE
  USING (auth.uid() = created_by);
      `);
      console.log('----------------------------------------\n');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL above');
      console.log('4. Click "Run" to execute\n');
      return;
    }

    console.log('✅ Table created successfully!');

    // Check if the table was created
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'field_blockout_dates')
      .single();

    if (checkError || !tables) {
      console.log('⚠️  Table may not have been created. Please check your Supabase dashboard.');
    } else {
      console.log('✅ Verified: field_blockout_dates table exists!');
    }

  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyFieldBlockoutMigration(); 