const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFresnoBuilding() {
  console.log('🏗️  CREATING BUILDING IN FRESNO STATE');
  console.log('====================================\n');

  try {
    // 1. Get Fresno State facility
    const { data: fresnoState } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('name', 'Fresno State')
      .single();

    if (!fresnoState) {
      console.log('❌ Fresno State facility not found!');
      return;
    }

    console.log(`✅ Found Fresno State: ${fresnoState.id}\n`);

    // 2. Create a test building
    const buildingData = {
      facility_id: fresnoState.id,
      name: 'Engineering Building',
      building_number: 'ENG-101',
      building_type: 'educational',
      construction_date: '2020-01-01',
      square_footage: 50000,
      number_of_rooms: 25,
      status: 'active',
      notes: 'Test building created via script',
      created_by: null
    };

    console.log('Creating building with data:');
    console.log(JSON.stringify(buildingData, null, 2));

    const { data: newBuilding, error } = await supabase
      .from('buildings')
      .insert([buildingData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating building:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      return;
    }

    console.log('\n✅ BUILDING CREATED SUCCESSFULLY!');
    console.log(`Building Name: ${newBuilding.name}`);
    console.log(`Building ID: ${newBuilding.id}`);
    console.log(`In Facility: Fresno State`);
    
    console.log('\n🎉 The building should now appear in Fresno State!');
    console.log('Go back to the browser and click the "Refresh" button.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the creation
createFresnoBuilding().then(() => {
  console.log('\n🏁 Done!');
  process.exit(0);
}); 