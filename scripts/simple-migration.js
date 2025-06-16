const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Since environment variables aren't available, let's use the client configuration from the app
// You'll need to temporarily add your Supabase URL and service role key here
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE';
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

if (supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('Please add your Supabase URL and service role key to this script');
  console.log('You can find these in your Supabase project settings');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    console.log('Creating building_systems table...');
    
    // Create building_systems table
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS building_systems (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
          system_type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          model VARCHAR(255),
          manufacturer VARCHAR(255),
          installation_date DATE,
          warranty_expiry DATE,
          condition VARCHAR(50),
          maintenance_schedule VARCHAR(50),
          last_maintenance_date DATE,
          next_maintenance_date DATE,
          status VARCHAR(50) DEFAULT 'operational',
          specifications JSONB,
          maintenance_details JSONB,
          maintenance_contact JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_building_systems_building_id ON building_systems(building_id);
        CREATE INDEX IF NOT EXISTS idx_building_systems_system_type ON building_systems(system_type);
        CREATE INDEX IF NOT EXISTS idx_building_systems_status ON building_systems(status);
        
        ALTER TABLE building_systems ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Allow all operations on building_systems" ON building_systems
          FOR ALL USING (true);
      `
    });
    
    if (error1) {
      console.error('Error creating building_systems table:', error1);
      return;
    }
    
    console.log('✓ building_systems table created successfully');
    
    // Test the table
    const { data, error: testError } = await supabase
      .from('building_systems')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('❌ Table test failed:', testError);
    } else {
      console.log('✓ building_systems table is accessible');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 