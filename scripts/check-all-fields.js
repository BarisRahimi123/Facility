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

async function checkAllFields() {
  console.log('Checking all fields in database...\n');

  try {
    // Get all fields
    const { data: fields, error } = await supabase
      .from('fields')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching fields:', error);
      return;
    }

    if (!fields || fields.length === 0) {
      console.log('❌ No fields found in the database');
      return;
    }

    console.log(`✅ Found ${fields.length} fields:\n`);
    
    fields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.name}`);
      console.log(`   - Type: ${field.type}`);
      console.log(`   - Facility ID: ${field.facility_id}`);
      console.log(`   - Status: ${field.status || 'available'}`);
      console.log(`   - Hourly Rate: $${field.hourly_rate}`);
      console.log(`   - Location: ${field.full_address || field.street_address || 'No address'}`);
      console.log(`   - Created: ${new Date(field.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // Check specifically for "Baris field"
    const barisField = fields.find(f => f.name.toLowerCase().includes('baris'));
    if (barisField) {
      console.log('✅ Found "Baris field"!');
      console.log('Full details:', JSON.stringify(barisField, null, 2));
    } else {
      console.log('❌ No field with "baris" in the name was found');
    }

  } catch (error) {
    console.error('Error checking fields:', error);
  }
}

checkAllFields(); 