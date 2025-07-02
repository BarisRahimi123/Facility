const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findBuilding() {
  // Get all facilities
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name')
    .order('name');
    
  console.log('\n📋 ALL FACILITIES AND THEIR BUILDINGS:\n');
  
  for (const facility of facilities) {
    const { data: buildings } = await supabase
      .from('buildings')
      .select('id, name, created_at')
      .eq('facility_id', facility.id)
      .order('created_at', { ascending: false });
      
    console.log(`${facility.name} (${facility.id}):`);
    if (buildings.length === 0) {
      console.log('  ❌ (no buildings)');
    } else {
      buildings.forEach(b => {
        const created = new Date(b.created_at);
        const isRecent = (Date.now() - created.getTime()) < 7200000; // Last 2 hours
        console.log(`  - ${b.name}${isRecent ? ' ⭐ (created recently)' : ''}`);
      });
    }
    console.log('');
  }
  
  console.log('\n💡 If you see your building under the wrong facility,');
  console.log('we need to update its facility_id in the database.');
}

findBuilding().then(() => process.exit(0)); 