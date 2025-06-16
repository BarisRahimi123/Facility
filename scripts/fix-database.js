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

async function fixDatabase() {
  try {
    console.log('Fixing database schema...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-database-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec', { sql: sqlContent });
    
    if (error) {
      console.error('Error fixing database:', error);
    } else {
      console.log('✓ Database schema fixed successfully!');
      console.log('✓ All required columns added');
      console.log('✓ Indexes created');
      console.log('✓ RLS disabled for testing');
      console.log('\nYou can now create facilities and buildings properly.');
    }
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixDatabase(); 