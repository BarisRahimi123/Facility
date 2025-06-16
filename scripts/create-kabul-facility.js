const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createKabulFacility() {
  try {
    console.log('Creating Kabul facility in database...\n');
    
    // Create the Kabul facility
    const facilityData = {
      name: 'Kabul',
      address: '2469, Fresno, Ca 93727',
      facility_type: 'Office',
      status: 'active',
      square_footage: 50000,
      year_built: 2010,
      facility_condition_index: 85,
      description: 'Main facility in Kabul',
      rooms: 0,
      active_issues: 0,
      occupancy_rate: 0,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .insert([facilityData])
      .select()
      .single();
    
    if (facilityError) {
      console.error('Error creating Kabul facility:', facilityError);
      return;
    }
    
    console.log('✓ Kabul facility created successfully!');
    console.log(`  ID: ${facility.id}`);
    console.log(`  Name: ${facility.name}`);
    console.log(`  Address: ${facility.address}`);
    console.log('');
    
    console.log('You can now:');
    console.log('1. Go to http://localhost:3000/facilities');
    console.log('2. Click on the Kabul facility');
    console.log('3. Add buildings to it');
    console.log('');
    console.log(`Direct link: http://localhost:3000/facility/${facility.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createKabulFacility(); 