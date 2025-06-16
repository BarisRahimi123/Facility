const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filename) {
  try {
    console.log(`\n=== Applying ${filename} ===`);
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration failed:', error);
      return false;
    }
    
    console.log('✓ Migration applied successfully');
    return true;
  } catch (error) {
    console.error('Error applying migration:', error);
    return false;
  }
}

async function main() {
  console.log('Applying building systems migrations...');
  
  // Apply building systems and renovations table creation
  const migration1Success = await runMigration('20250115_create_building_systems_renovations.sql');
  
  if (migration1Success) {
    // Apply maintenance contact column addition
    const migration2Success = await runMigration('20250115_add_maintenance_contact_to_building_systems.sql');
    
    if (migration2Success) {
      console.log('\n✅ All migrations applied successfully!');
      
      // Test that the tables exist
      console.log('\n=== Testing tables ===');
      
      // Test building_systems table
      const { data: systems, error: systemsError } = await supabase
        .from('building_systems')
        .select('*')
        .limit(1);
        
      if (systemsError) {
        console.error('❌ building_systems table test failed:', systemsError);
      } else {
        console.log('✓ building_systems table is accessible');
      }
      
      // Test renovations table
      const { data: renovations, error: renovationsError } = await supabase
        .from('renovations')
        .select('*')
        .limit(1);
        
      if (renovationsError) {
        console.error('❌ renovations table test failed:', renovationsError);
      } else {
        console.log('✓ renovations table is accessible');
      }
      
    } else {
      console.log('❌ Failed to apply second migration');
    }
  } else {
    console.log('❌ Failed to apply first migration');
  }
}

main().catch(console.error); 