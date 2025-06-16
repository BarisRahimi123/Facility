const { createClient } = require('@supabase/supabase-js');

// Create Supabase client using the same configuration as your app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('Environment variables not found. Using the client configuration from your app...');
  console.log('Please make sure your .env.local file has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addMaintenanceContactColumn() {
  try {
    console.log('Adding maintenance_contact column to building_systems table...');
    
    // Add the maintenance_contact column
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add maintenance_contact column to building_systems table
        ALTER TABLE building_systems 
        ADD COLUMN IF NOT EXISTS maintenance_contact JSONB;
        
        -- Add comment for the new column
        COMMENT ON COLUMN building_systems.maintenance_contact IS 'Contact information for maintenance reminders (name, email, phone, company)';
      `
    });
    
    if (error) {
      console.error('❌ Error adding column:', error);
      return false;
    }
    
    console.log('✅ maintenance_contact column added successfully!');
    
    // Test that we can query the table with the new column
    const { data, error: testError } = await supabase
      .from('building_systems')
      .select('id, name, maintenance_contact')
      .limit(1);
      
    if (testError) {
      console.error('❌ Test query failed:', testError);
      return false;
    }
    
    console.log('✅ Column is accessible and ready to use');
    console.log('\nNow you can:');
    console.log('1. Try adding a building system again');
    console.log('2. The maintenance contact information will be saved properly');
    console.log('3. Systems should appear in the UI immediately after creation');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

addMaintenanceContactColumn(); 