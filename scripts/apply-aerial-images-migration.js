const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyAerialImagesMigration() {
  try {
    console.log('🔄 Applying aerial images migration...');

    // Check if table already exists
    const { data: existingTable, error: checkError } = await client
      .from('aerial_images')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ aerial_images table already exists');
      return;
    }

    console.log('📋 Table does not exist, creating...');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250115_create_aerial_images_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📁 Migration file loaded, executing SQL...');

    // Execute the migration
    const { error: migrationError } = await client.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (migrationError) {
      // Try alternative method - split into individual statements
      console.log('🔄 Trying alternative execution method...');
      
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('ALTER') || statement.includes('INSERT')) {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          const { error } = await client.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.error('Error executing statement:', error);
          }
        }
      }
    }

    // Verify the table was created
    const { data: verifyTable, error: verifyError } = await client
      .from('aerial_images')
      .select('id')
      .limit(1);

    if (verifyError) {
      console.error('❌ Migration failed - table still does not exist:', verifyError);
    } else {
      console.log('✅ Migration completed successfully!');
      console.log('🎯 aerial_images table is now available');
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

// Run the migration
applyAerialImagesMigration(); 