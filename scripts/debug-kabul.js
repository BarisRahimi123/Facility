const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugKabul() {
  try {
    console.log('Debugging Kabul facility issue...\n');
    
    // 1. Search for any facility with "Kabul" in the name
    console.log('1. Searching for Kabul facility...');
    const { data: kabulFacilities, error: searchError } = await supabase
      .from('facilities')
      .select('*')
      .ilike('name', '%kabul%');
    
    if (searchError) {
      console.error('Error searching for Kabul:', searchError);
    } else if (kabulFacilities && kabulFacilities.length > 0) {
      console.log(`Found ${kabulFacilities.length} Kabul facilities:`);
      kabulFacilities.forEach(facility => {
        console.log(`  - ${facility.name} (ID: ${facility.id})`);
      });
    } else {
      console.log('No Kabul facility found in database.');
      console.log('\nThe Kabul facility might only exist in memory (mock data).');
      console.log('You need to create it again to save it to the database.');
    }
    
    // 2. Show all facilities to help identify the correct one
    console.log('\n2. All facilities in database:');
    const { data: allFacilities, error: allError } = await supabase
      .from('facilities')
      .select('id, name, address, created_at')
      .order('created_at', { ascending: false });
    
    if (!allError && allFacilities) {
      allFacilities.forEach((facility, index) => {
        console.log(`${index + 1}. ${facility.name}`);
        console.log(`   ID: ${facility.id}`);
        console.log(`   Address: ${facility.address}`);
        console.log(`   Created: ${new Date(facility.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
    // 3. Check if there are any orphaned buildings
    console.log('\n3. Checking for orphaned buildings...');
    const { data: allBuildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, name, facility_id, created_at')
      .order('created_at', { ascending: false });
    
    if (!buildingsError && allBuildings) {
      const facilityIds = allFacilities ? allFacilities.map(f => f.id) : [];
      const orphanedBuildings = allBuildings.filter(b => !facilityIds.includes(b.facility_id));
      
      if (orphanedBuildings.length > 0) {
        console.log(`Found ${orphanedBuildings.length} orphaned buildings:`);
        orphanedBuildings.forEach(building => {
          console.log(`  - ${building.name} (Facility ID: ${building.facility_id})`);
        });
      } else {
        console.log('No orphaned buildings found.');
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugKabul(); 