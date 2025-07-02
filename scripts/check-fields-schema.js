const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFieldsSchema() {
  try {
    console.log('🔍 Checking fields table schema...');
    
    // Check what fields exist by trying to select all columns
    const { data: fields, error } = await supabase
      .from('fields')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error querying fields table:', error);
      return;
    }
    
    console.log('✅ Fields table exists');
    
    if (fields && fields.length > 0) {
      console.log('\n📋 Current fields table columns:');
      const columns = Object.keys(fields[0]);
      columns.forEach(col => console.log(`  - ${col}`));
      
      console.log('\n🔍 Checking for required columns:');
      const requiredColumns = [
        'street_address', 'zip_code', 'city', 'state', 'full_address',
        'aerial_image_url', 'aerial_image_description', 'virtual_tour_url',
        'gallery_images', 'latitude', 'longitude'
      ];
      
      requiredColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`  ✅ ${col}`);
        } else {
          console.log(`  ❌ ${col} - MISSING`);
        }
      });
    } else {
      console.log('📋 Table is empty, checking with describe...');
      
      // Try to get table info using information_schema
      const { data: schemaInfo, error: schemaError } = await supabase
        .rpc('get_table_columns', { table_name: 'fields' });
      
      if (schemaError) {
        console.log('Could not get schema info:', schemaError);
      } else {
        console.log('Schema info:', schemaInfo);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

// Run the check
checkFieldsSchema(); 