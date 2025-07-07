require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBlackoutTable() {
  console.log('🔍 Checking field_blackout_dates table...\n');
  
  try {
    // Check if field_blackout_dates table exists
    const { data, error } = await supabase
      .from('field_blackout_dates')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ field_blackout_dates table does NOT exist!');
        console.log('\n📋 To fix this, you need to apply the migration:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Open SQL Editor');
        console.log('3. Run the following SQL:\n');
        
        console.log(`
-- Create field_blackout_dates table
CREATE TABLE IF NOT EXISTS public.field_blackout_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES public.fields(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  description TEXT,
  recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('daily', 'weekly', 'monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_field_id ON public.field_blackout_dates(field_id);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_date_range ON public.field_blackout_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_field_blockout_dates_status ON public.field_blackout_dates(status);

-- Enable RLS but allow public access for now
ALTER TABLE public.field_blackout_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Field blackout dates are viewable by everyone"
  ON public.field_blackout_dates FOR SELECT USING (true);

CREATE POLICY "Field blackout dates are insertable by authenticated users"
  ON public.field_blackout_dates FOR INSERT WITH CHECK (true);

CREATE POLICY "Field blackout dates are updatable by authenticated users"
  ON public.field_blackout_dates FOR UPDATE USING (true);

CREATE POLICY "Field blackout dates are deletable by authenticated users"
  ON public.field_blackout_dates FOR DELETE USING (true);
        `);
      } else {
        console.error('Error querying table:', error);
      }
    } else {
      console.log('✅ field_blackout_dates table exists!');
      console.log(`Found ${data.length} blackout records`);
      
      if (data.length > 0) {
        console.log('\nSample record:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    }
    
    // Also check if fields table exists
    console.log('\n🔍 Checking fields table...');
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('id, name')
      .limit(3);
    
    if (fieldsError) {
      console.log('❌ Fields table error:', fieldsError.message);
    } else {
      console.log(`✅ Fields table exists with ${fields.length} fields`);
      fields.forEach(field => console.log(`  - ${field.name}`));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkBlackoutTable(); 