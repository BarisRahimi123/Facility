const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFieldsSetup() {
  console.log('=== VERIFYING FIELDS SETUP ===\n');
  
  try {
    // Check if fields table exists
    console.log('1. Checking fields table...');
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('*')
      .limit(1);
    
    if (fieldsError) {
      console.log('❌ Fields table: NOT FOUND');
      console.log(`   Error: ${fieldsError.message}`);
    } else {
      console.log('✅ Fields table: EXISTS');
    }
    
    // Check if reservations table exists
    console.log('\n2. Checking reservations table...');
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (reservationsError) {
      console.log('❌ Reservations table: NOT FOUND');
      console.log(`   Error: ${reservationsError.message}`);
    } else {
      console.log('✅ Reservations table: EXISTS');
    }
    
    // Check if field_blackout_dates table exists
    console.log('\n3. Checking field_blackout_dates table...');
    const { data: blackouts, error: blackoutsError } = await supabase
      .from('field_blackout_dates')
      .select('*')
      .limit(1);
    
    if (blackoutsError) {
      console.log('❌ Field blackout dates table: NOT FOUND');
      console.log(`   Error: ${blackoutsError.message}`);
    } else {
      console.log('✅ Field blackout dates table: EXISTS');
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    if (!fieldsError && !reservationsError && !blackoutsError) {
      console.log('✅ All tables created successfully!');
      console.log('🎉 The Fields module is ready to use.');
    } else {
      console.log('❌ Some tables are missing.');
      console.log('📖 Please apply the migration manually through Supabase dashboard.');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

verifyFieldsSetup(); 