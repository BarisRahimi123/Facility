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

async function diagnoseBuildings() {
  console.log('🔍 Diagnosing Buildings Issue...\n');

  try {
    // 1. Check all facilities
    console.log('1️⃣ Checking all facilities in database:');
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name, address')
      .order('created_at', { ascending: false })
      .limit(10);

    if (facilitiesError) {
      console.error('❌ Error fetching facilities:', facilitiesError);
      return;
    }

    console.log(`Found ${facilities?.length || 0} facilities:`);
    facilities?.forEach(f => {
      console.log(`  - ID: ${f.id} | Name: ${f.name} | Address: ${f.address}`);
    });

    // 2. Check all buildings
    console.log('\n2️⃣ Checking all buildings in database:');
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, name, facility_id, building_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (buildingsError) {
      console.error('❌ Error fetching buildings:', buildingsError);
      return;
    }

    console.log(`Found ${buildings?.length || 0} buildings:`);
    buildings?.forEach(b => {
      console.log(`  - ID: ${b.id}`);
      console.log(`    Name: ${b.name}`);
      console.log(`    Facility ID: ${b.facility_id}`);
      console.log(`    Type: ${b.building_type}`);
      console.log(`    Created: ${new Date(b.created_at).toLocaleString()}`);
      console.log('');
    });

    // 3. Check facility-building relationships
    console.log('3️⃣ Checking facility-building relationships:');
    for (const facility of facilities || []) {
      const { data: facilityBuildings, error } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('facility_id', facility.id);

      if (!error) {
        console.log(`\nFacility "${facility.name}" (${facility.id}):`);
        if (facilityBuildings && facilityBuildings.length > 0) {
          facilityBuildings.forEach(b => {
            console.log(`  ✅ Has building: ${b.name} (${b.id})`);
          });
        } else {
          console.log(`  ⚠️  No buildings found`);
        }
      }
    }

    // 4. Check for orphaned buildings
    console.log('\n4️⃣ Checking for orphaned buildings (invalid facility_id):');
    const { data: orphanedBuildings, error: orphanedError } = await supabase
      .from('buildings')
      .select('id, name, facility_id')
      .filter('facility_id', 'not.in', `(${facilities?.map(f => `'${f.id}'`).join(',')})`);

    if (!orphanedError && orphanedBuildings && orphanedBuildings.length > 0) {
      console.log('⚠️  Found orphaned buildings:');
      orphanedBuildings.forEach(b => {
        console.log(`  - ${b.name} (${b.id}) with facility_id: ${b.facility_id}`);
      });
    } else {
      console.log('✅ No orphaned buildings found');
    }

    // 5. Check recent building creation attempts
    console.log('\n5️⃣ Most recent buildings (last 5):');
    const { data: recentBuildings } = await supabase
      .from('buildings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    recentBuildings?.forEach(b => {
      console.log(`\n  Building: ${b.name}`);
      console.log(`  ID: ${b.id}`);
      console.log(`  Facility ID: ${b.facility_id}`);
      console.log(`  Created: ${new Date(b.created_at).toLocaleString()}`);
      console.log(`  All fields:`, JSON.stringify(b, null, 2));
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run diagnosis
diagnoseBuildings().then(() => {
  console.log('\n✅ Diagnosis complete');
  process.exit(0);
}); 