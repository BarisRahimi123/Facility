const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFieldsTable() {
  console.log('Checking fields table schema...');
  
  // First, try to query the fields table to see if it exists
  const { data: fields, error } = await supabase
    .from('fields')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error checking fields table:', error);
    if (error.code === '42P01') {
      console.log('\n❌ Fields table does not exist!');
      console.log('You need to apply the fields migration first.');
    }
    return;
  }
  
  console.log('\n✅ Fields table exists');
  
  if (fields && fields.length > 0) {
    console.log('\nFields table columns:');
    const columns = Object.keys(fields[0]);
    columns.forEach(col => {
      console.log(`- ${col}`);
    });
    
    // Check specifically for address columns
    const addressColumns = ['city', 'state', 'full_address', 'street_address', 'zip_code'];
    const missingColumns = addressColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n❌ Missing address columns:', missingColumns);
      console.log('\nThese columns need to be added to fix the field creation error.');
    } else {
      console.log('\n✅ All address columns exist');
    }
  } else {
    console.log('\n📋 Table is empty, checking structure by trying to insert test data...');
    
    // Try to get error details by attempting to insert with missing columns
    const { error: insertError } = await supabase
      .from('fields')
      .insert({
        facility_id: '00000000-0000-0000-0000-000000000000',
        name: 'test',
        type: 'test',
        city: 'test'
      });
    
    if (insertError) {
      console.log('Insert error (shows missing columns):', insertError);
    }
  }
}

// Run the check
checkFieldsTable().catch(console.error); 