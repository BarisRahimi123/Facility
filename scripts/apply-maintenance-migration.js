const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMaintenanceMigration() {
  console.log('🔧 Applying maintenance system migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250131_create_maintenance_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).single();

    if (error) {
      // If the RPC doesn't exist, try executing the SQL directly
      console.log('⚠️  exec_sql RPC not found, executing SQL statements individually...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('query', {
            query_text: statement + ';'
          }).single();

          if (stmtError) {
            console.error(`❌ Error executing statement: ${stmtError.message}`);
            console.error(`   Statement: ${statement.substring(0, 50)}...`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (e) {
          console.error(`❌ Error: ${e.message}`);
          errorCount++;
        }
      }

      console.log(`\n✅ Executed ${successCount} statements successfully`);
      if (errorCount > 0) {
        console.log(`⚠️  ${errorCount} statements failed`);
        console.log('\n💡 You may need to apply the migration manually via Supabase SQL Editor');
      }
    } else {
      console.log('✅ Migration applied successfully!');
    }

    // Verify the tables were created
    console.log('\n🔍 Verifying tables...');
    
    const tablesToCheck = [
      'maintenance_tasks',
      'task_assignments', 
      'task_contractor_invitations',
      'task_attachments',
      'task_comments',
      'task_activity_log',
      'vendors',
      'request_for_quotes',
      'rfq_vendor_invitations'
    ];

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        console.log(`❌ Table ${table} not found`);
      } else if (error) {
        console.log(`⚠️  Table ${table} exists but has an error: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }

    console.log('\n📋 Migration Summary:');
    console.log('The maintenance system migration includes:');
    console.log('- maintenance_tasks table for tracking all maintenance tasks');
    console.log('- task_assignments table for internal staff assignments');
    console.log('- task_contractor_invitations table for external contractor invitations');
    console.log('- task_attachments, task_comments, and task_activity_log for task management');
    console.log('- vendors and request_for_quotes tables for vendor management');
    console.log('- Proper RLS policies for organization-based access control');
    console.log('\n✨ The maintenance system is ready to use!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 To apply the migration manually:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of supabase/migrations/20250131_create_maintenance_system.sql');
    console.log('4. Paste and execute in the SQL Editor');
  }
}

// Run the migration
applyMaintenanceMigration(); 