const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to fields table...');
    
    const alterStatements = [
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS street_address TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS zip_code TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS city TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS state TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS full_address TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS aerial_image_url TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS aerial_image_description TEXT;',
      'ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS aerial_image_bounds JSONB;'
    ];
    
    console.log('Adding columns:');
    console.log('- street_address');
    console.log('- zip_code');
    console.log('- city');
    console.log('- state');
    console.log('- full_address');
    console.log('- aerial_image_url');
    console.log('- aerial_image_description');
    console.log('- aerial_image_bounds');
    
    console.log('\n📋 SQL commands to run manually:');
    console.log('Copy and paste these into Supabase SQL Editor:');
    console.log('');
    alterStatements.forEach(sql => console.log(sql));
    
    console.log('\n🔗 Direct link to SQL Editor:');
    console.log('https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/sql/new');
    
    console.log('\n⚠️  Note: These columns need to be added manually in Supabase Dashboard');
    console.log('The Supabase client cannot execute ALTER TABLE statements for security reasons.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
addMissingColumns(); 