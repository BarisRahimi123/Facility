const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBuildings() {
  try {
    console.log('Setting up buildings table...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-buildings-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('Error setting up buildings table:', error);
    } else {
      console.log('✓ Buildings table setup complete!');
      console.log('✓ RLS disabled for testing');
      console.log('✓ All required columns added');
      console.log('\nYou can now create buildings in the database.');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupBuildings(); 