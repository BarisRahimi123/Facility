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

async function checkBarisFieldFacility() {
  console.log('Checking which facility Baris field belongs to...\n');

  try {
    // Get the facility that contains Baris field
    const { data: facility, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', '6624366f-3bb0-4f59-85fb-dfc087dab018')
      .single();

    if (error) {
      console.error('Error fetching facility:', error);
      return;
    }

    if (!facility) {
      console.log('❌ Facility not found');
      return;
    }

    console.log('✅ Baris field belongs to:');
    console.log(`   Facility: ${facility.name}`);
    console.log(`   Type: ${facility.facility_type}`);
    console.log(`   Address: ${facility.address}`);
    console.log(`   Status: ${facility.status}`);
    console.log('');

    // Get all fields for this facility
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('name, type')
      .eq('facility_id', facility.id)
      .order('name', { ascending: true });

    if (!fieldsError && fields && fields.length > 0) {
      console.log(`This facility has ${fields.length} fields:`);
      fields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.name} (${field.type})`);
      });
    }

  } catch (error) {
    console.error('Error checking facility:', error);
  }
}

checkBarisFieldFacility(); 