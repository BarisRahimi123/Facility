const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyAddressFieldsMigration() {
  console.log('🔧 Applying address fields migration to fields table...');
  
  try {
    // Add the missing address columns
    const migrations = [
      'ALTER TABLE fields ADD COLUMN IF NOT EXISTS street_address TEXT;',
      'ALTER TABLE fields ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);',
      'ALTER TABLE fields ADD COLUMN IF NOT EXISTS city TEXT;',
      'ALTER TABLE fields ADD COLUMN IF NOT EXISTS state VARCHAR(2);',
      'ALTER TABLE fields ADD COLUMN IF NOT EXISTS full_address TEXT;',
      'CREATE INDEX IF NOT EXISTS idx_fields_coordinates ON fields (latitude, longitude);',
      'CREATE INDEX IF NOT EXISTS idx_fields_full_address ON fields (full_address);',
      'CREATE INDEX IF NOT EXISTS idx_fields_city_state ON fields (city, state);'
    ];
    
    for (const migration of migrations) {
      console.log(`Executing: ${migration}`);
      const { error } = await supabase.rpc('exec_sql', { sql: migration });
      
      if (error) {
        console.error(`❌ Error executing migration: ${migration}`, error);
        return;
      }
    }
    
    console.log('✅ Address fields migration applied successfully!');
    
    // Verify the columns were added
    console.log('\n🔍 Verifying columns were added...');
    
    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error verifying columns:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const addressColumns = ['city', 'state', 'full_address', 'street_address', 'zip_code'];
      
      console.log('\nAddress columns status:');
      addressColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`✅ ${col} - Added successfully`);
        } else {
          console.log(`❌ ${col} - Still missing`);
        }
      });
    } else {
      console.log('Table is empty, but columns should be added');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyAddressFieldsMigration().catch(console.error); 