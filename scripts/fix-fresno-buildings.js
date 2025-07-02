const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFresnoBuildings() {
  console.log('🔧 FIXING FRESNO STATE BUILDINGS');
  console.log('================================\n');

  try {
    // 1. Get Fresno State facility
    const { data: fresnoFacility } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('name', 'Fresno State')
      .single();

    if (!fresnoFacility) {
      console.log('❌ Fresno State facility not found');
      return;
    }

    console.log(`✅ Found Fresno State: ${fresnoFacility.id}\n`);

    // 2. Look for recent buildings that might belong to Fresno State
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentBuildings } = await supabase
      .from('buildings')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (!recentBuildings || recentBuildings.length === 0) {
      console.log('No buildings created in the last hour.');
      console.log('\n💡 TIP: If you just created a building for Fresno State:');
      console.log('1. Try clicking the "Refresh" button in the Buildings tab');
      console.log('2. Create the building again - it should work now');
      return;
    }

    console.log('Recent buildings created (last hour):');
    recentBuildings.forEach((building, index) => {
      console.log(`\n${index + 1}. ${building.name}`);
      console.log(`   ID: ${building.id}`);
      console.log(`   Current facility: ${building.facility_id}`);
      console.log(`   Created: ${new Date(building.created_at).toLocaleString()}`);
    });

    // 3. Ask which building to move (in a real script, this would be interactive)
    console.log('\n📝 To move a building to Fresno State, run this SQL command:');
    console.log('\nUPDATE buildings');
    console.log(`SET facility_id = '${fresnoFacility.id}'`);
    console.log("WHERE id = 'BUILDING_ID_HERE';");
    
    console.log('\n💡 Or use this command to move the most recent building:');
    if (recentBuildings.length > 0) {
      const mostRecent = recentBuildings[0];
      console.log(`\nUPDATE buildings`);
      console.log(`SET facility_id = '${fresnoFacility.id}'`);
      console.log(`WHERE id = '${mostRecent.id}';`);
      console.log(`\n-- This will move "${mostRecent.name}" to Fresno State`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixFresnoBuildings().then(() => {
  console.log('\n🏁 Done!');
  process.exit(0);
}); 