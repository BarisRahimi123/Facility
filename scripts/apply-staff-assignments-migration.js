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

async function applyStaffAssignmentsMigration() {
  console.log('🚀 Applying staff assignments migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250124_staff_field_room_assignments.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📊 Migration contains ${migrationSQL.length} characters\n`);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      console.log(`${i + 1}/${statements.length}: Executing statement...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';'
        });

        if (error) {
          // Try alternative approach for statements that don't work with rpc
          const { error: directError } = await supabase
            .from('dummy') // This will fail, but we're using it to execute SQL
            .select('*')
            .limit(0);

          // For now, we'll ignore some RPC errors and continue
          if (error.message.includes('function exec_sql') || error.message.includes('does not exist')) {
            console.log(`⚠️  Skipping statement (exec_sql not available): ${statement.substring(0, 50)}...`);
            continue;
          } else {
            console.log(`❌ Error in statement ${i + 1}: ${error.message}`);
            continue; // Continue with other statements
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} failed: ${err.message}`);
        continue; // Continue with other statements
      }
    }

    console.log('\n🎉 Migration application completed!');
    console.log('🔍 Running verification check...\n');

    // Verify the tables were created
    const { data: fieldAssignments, error: fieldError } = await supabase
      .from('staff_field_assignments')
      .select('count()')
      .limit(1);

    if (fieldError) {
      console.log('❌ staff_field_assignments table still not accessible:', fieldError.message);
    } else {
      console.log('✅ staff_field_assignments table is now accessible');
    }

    const { data: roomAssignments, error: roomError } = await supabase
      .from('staff_room_assignments')
      .select('count()')
      .limit(1);

    if (roomError) {
      console.log('❌ staff_room_assignments table still not accessible:', roomError.message);
    } else {
      console.log('✅ staff_room_assignments table is now accessible');
    }

    const { data: roomBlockouts, error: blockoutError } = await supabase
      .from('room_blockout_dates')
      .select('count()')
      .limit(1);

    if (blockoutError) {
      console.log('❌ room_blockout_dates table still not accessible:', blockoutError.message);
    } else {
      console.log('✅ room_blockout_dates table is now accessible');
    }

  } catch (error) {
    console.error('💥 Error applying migration:', error);
  }
}

// Run the migration
applyStaffAssignmentsMigration().then(() => {
  console.log('\n✨ Staff assignments migration process complete!');
  console.log('📝 Note: If some statements failed, you may need to apply them manually in the Supabase dashboard');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 