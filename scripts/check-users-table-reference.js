const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsersTable() {
  console.log('Checking which users table to reference...\n');

  try {
    // Check if custom users table exists
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!customError && customUsers) {
      console.log('✅ Custom users table exists');
      
      // Check if fields table references custom users table
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'users');

      if (!colError && columns) {
        console.log('\nCustom users table columns:');
        columns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
      
      console.log('\n✅ You should use references to "users" table, not "auth.users"');
      console.log('\nUse this in your field_blockout_dates table:');
      console.log('  created_by UUID REFERENCES users(id) ON DELETE SET NULL');
    } else {
      console.log('❌ Custom users table not found or error:', customError?.message);
      console.log('\nYou should use references to "auth.users" table');
      console.log('\nUse this in your field_blockout_dates table:');
      console.log('  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL');
    }

  } catch (error) {
    console.error('Error checking users table:', error);
  }
}

checkUsersTable(); 