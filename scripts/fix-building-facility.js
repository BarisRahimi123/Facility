#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBuildingFacilities() {
  console.log('🔍 Checking building-facility associations...\n');

  try {
    // Get Mendota High School facility ID
    const { data: mendotaFacility, error: mendotaError } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('name', 'Mendota High school')
      .single();

    if (mendotaError || !mendotaFacility) {
      console.error('❌ Could not find Mendota High School facility');
      return;
    }

    console.log(`✅ Found Mendota High School: ${mendotaFacility.id}`);

    // Get all buildings currently assigned to Washington Elementary
    const { data: washingtonFacility, error: washError } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('name', 'Washington Elementary ')
      .single();

    if (washError || !washingtonFacility) {
      console.error('❌ Could not find Washington Elementary facility');
      return;
    }

    console.log(`✅ Found Washington Elementary: ${washingtonFacility.id}`);

    // Get all buildings
    const { data: allBuildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, name, facility_id, created_at')
      .order('created_at', { ascending: false });

    if (buildingsError) {
      console.error('❌ Error fetching buildings:', buildingsError);
      return;
    }

    console.log(`\n📋 Current building assignments:`);
    allBuildings.forEach(b => {
      const facilityName = b.facility_id === mendotaFacility.id ? 'Mendota High School' :
                          b.facility_id === washingtonFacility.id ? 'Washington Elementary' :
                          'Unknown';
      console.log(`  - ${b.name} (${b.id}) -> ${facilityName}`);
    });

    // Ask user which buildings should be moved to Mendota High School
    console.log('\n❓ Which buildings should be assigned to Mendota High School?');
    console.log('   (Based on your recent attempts, it seems you wanted to create buildings for Mendota)');
    
    // Get recently created buildings that might need reassignment
    const recentBuildings = allBuildings.filter(b => {
      const createdDate = new Date(b.created_at);
      const hoursSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation < 24; // Buildings created in last 24 hours
    });

    if (recentBuildings.length > 0) {
      console.log('\n🆕 Recently created buildings (last 24 hours):');
      recentBuildings.forEach(b => {
        console.log(`  - ${b.name} (created ${new Date(b.created_at).toLocaleString()})`);
      });

      console.log('\n💡 To fix the association, I can move these recent buildings to Mendota High School.');
      console.log('   Would you like me to do this? (This script is read-only for safety)');
      
      // For safety, just show the SQL command instead of executing it
      console.log('\n📝 SQL command to fix this issue:');
      console.log(`
UPDATE buildings 
SET facility_id = '${mendotaFacility.id}'
WHERE id IN (${recentBuildings.map(b => `'${b.id}'`).join(', ')})
AND facility_id = '${washingtonFacility.id}';
`);
      
      console.log('\n✅ You can run this SQL in your Supabase dashboard to fix the associations.');
    } else {
      console.log('\n✅ No recently created buildings found that need reassignment.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixBuildingFacilities().then(() => {
  console.log('\n✅ Analysis complete');
  process.exit(0);
}); 