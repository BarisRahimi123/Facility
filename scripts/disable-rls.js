const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  try {
    console.log('Disabling RLS policies for testing...');
    
    // Disable RLS on facilities table
    const { error: facilitiesError } = await supabase
      .rpc('exec', { 
        sql: 'ALTER TABLE facilities DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (facilitiesError) {
      console.error('Error disabling RLS on facilities:', facilitiesError);
    } else {
      console.log('✓ RLS disabled on facilities table');
    }
    
    // Disable RLS on buildings table
    const { error: buildingsError } = await supabase
      .rpc('exec', { 
        sql: 'ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (buildingsError) {
      console.error('Error disabling RLS on buildings:', buildingsError);
    } else {
      console.log('✓ RLS disabled on buildings table');
    }
    
    // Disable RLS on rooms table
    const { error: roomsError } = await supabase
      .rpc('exec', { 
        sql: 'ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;' 
      });
    
    if (roomsError) {
      console.error('Error disabling RLS on rooms:', roomsError);
    } else {
      console.log('✓ RLS disabled on rooms table');
    }
    
    console.log('\nRLS has been disabled for testing. Remember to re-enable it for production!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

disableRLS(); 