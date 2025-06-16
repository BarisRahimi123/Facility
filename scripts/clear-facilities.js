const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearFacilities() {
  try {
    console.log('Clearing all facilities from database...');
    
    const { data, error } = await supabase
      .from('facilities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except system facility if any
    
    if (error) {
      console.error('Error clearing facilities:', error);
    } else {
      console.log('✓ All facilities cleared from database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

clearFacilities(); 