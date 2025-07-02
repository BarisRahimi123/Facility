const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findMissingBuilding() {
  console.log('🔍 SEARCHING FOR MISSING BUILDING');
  console.log('=================================\n');

  try {
    // 1. Get all facilities
    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, name');

    const facilityMap = {};
    facilities.forEach(f => {
      facilityMap[f.id] = f.name;
    });

    // 2. Get Fresno State ID
    const fresnoState = facilities.find(f => f.name === 'Fresno State');
    console.log(`Fresno State ID: ${fresnoState?.id}\n`);

    // 3. Get ALL buildings created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todaysBuildings } = await supabase
      .from('buildings')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    console.log(`Buildings created today: ${todaysBuildings?.length || 0}\n`);

    if (todaysBuildings && todaysBuildings.length > 0) {
      console.log('TODAY\'S BUILDINGS:');
      todaysBuildings.forEach(b => {
        const facilityName = facilityMap[b.facility_id] || 'UNKNOWN';
        console.log(`\n- ${b.name}`);
        console.log(`  Building ID: ${b.id}`);
        console.log(`  Assigned to: ${facilityName} (${b.facility_id})`);
        console.log(`  Created: ${new Date(b.created_at).toLocaleString()}`);
        
        if (fresnoState && b.facility_id !== fresnoState.id && facilityName !== 'Fresno State') {
          console.log(`  ⚠️  NOT in Fresno State - might need to be moved!`);
        }
      });

      // 4. Provide SQL to fix
      const wrongBuildings = todaysBuildings.filter(b => 
        fresnoState && b.facility_id !== fresnoState.id
      );

      if (wrongBuildings.length > 0 && fresnoState) {
        console.log('\n\n📝 SQL TO MOVE BUILDINGS TO FRESNO STATE:');
        wrongBuildings.forEach(b => {
          console.log(`\n-- Move "${b.name}" to Fresno State:`);
          console.log(`UPDATE buildings`);
          console.log(`SET facility_id = '${fresnoState.id}'`);
          console.log(`WHERE id = '${b.id}';`);
        });
      }
    } else {
      console.log('❌ No buildings created today!');
      console.log('\nPossible issues:');
      console.log('1. Building creation is failing silently');
      console.log('2. There\'s a database connection issue');
      console.log('3. The success message is showing incorrectly');
    }

    // 5. Check last 10 buildings regardless of date
    console.log('\n\n📋 LAST 10 BUILDINGS IN DATABASE:');
    const { data: recentBuildings } = await supabase
      .from('buildings')
      .select('id, name, facility_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    recentBuildings.forEach(b => {
      const facilityName = facilityMap[b.facility_id] || 'UNKNOWN';
      const created = new Date(b.created_at);
      const hoursAgo = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60));
      console.log(`\n- ${b.name} (${hoursAgo} hours ago)`);
      console.log(`  In: ${facilityName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findMissingBuilding().then(() => {
  console.log('\n\n🏁 Search complete!');
  process.exit(0);
}); 