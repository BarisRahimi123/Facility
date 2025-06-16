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

async function setupDatabase() {
  try {
    console.log('Setting up database for real data testing...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL statements by semicolon
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' });
        
        if (error) {
          console.error('Error:', error.message);
        } else {
          console.log('✓ Success');
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
      
      console.log('');
    }
    
    console.log('\nDatabase setup complete!');
    console.log('You can now create and store facilities in the real database.');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase(); 