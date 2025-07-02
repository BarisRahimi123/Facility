const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFacilities() {
  console.log('Checking facility data...\n');
  
  const { data, error } = await supabase
    .from('facilities')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Found facilities:');
  data.forEach((facility, index) => {
    console.log(`${index + 1}. ${facility.name}`);
    console.log(`   Address: ${facility.address || 'No address'}`);
    console.log(`   Type: ${facility.facility_type || 'No type'}`);
    console.log(`   All data:`, JSON.stringify(facility, null, 2));
    console.log('');
  });
}

checkFacilities(); 