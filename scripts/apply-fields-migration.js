const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFieldsMigration() {
  try {
    console.log('🚀 Checking fields table status...');
    
    // Check if fields table exists
    const { data: fieldsCheck, error: fieldsError } = await supabase
      .from('fields')
      .select('id')
      .limit(1);
    
    if (fieldsError && fieldsError.code === '42P01') {
      console.log('❌ Fields table does not exist. Manual migration required.');
      console.log('\n📋 Please apply the migration manually:');
      console.log('1. Go to https://supabase.com/dashboard/project/ahntaamtsypranvnofxy');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New query"');
      console.log('4. Copy the content from: supabase/migrations/20250117_create_fields_and_reservations_tables.sql');
      console.log('5. Paste and run the migration');
      console.log('6. Refresh your application');
      console.log('\n🔗 Direct link: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/sql/new');
      return;
    } else if (!fieldsError) {
      console.log('✅ Fields table already exists!');
      console.log('✅ You can now create fields in the application');
      return;
    } else {
      console.error('❌ Error checking fields table:', fieldsError);
      return;
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    console.log('\n📋 Please apply the migration manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/ahntaamtsypranvnofxy');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New query"');
    console.log('4. Copy the content from: supabase/migrations/20250117_create_fields_and_reservations_tables.sql');
    console.log('5. Paste and run the migration');
    console.log('6. Refresh your application');
    console.log('\n🔗 Direct link: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/sql/new');
  }
}

// Run the migration
applyFieldsMigration(); 