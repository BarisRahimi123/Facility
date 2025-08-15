import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFacilityData() {
  console.log('🔍 Checking facility data in the database...\n');

  try {
    // Get all facilities
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('status', 'active');

    if (facilitiesError) {
      console.error('❌ Error fetching facilities:', facilitiesError);
      return;
    }

    console.log(`📊 Found ${facilities?.length || 0} active facilities\n`);

    // For each facility, check buildings, fields, and rooms
    for (const facility of facilities || []) {
      console.log(`\n🏢 Facility: ${facility.name} (${facility.id})`);
      console.log('=' .repeat(60));

      // Check buildings
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('facility_id', facility.id);

      if (buildingsError) {
        console.log('  ❌ Buildings table error:', buildingsError.message);
      } else {
        console.log(`  📦 Buildings: ${buildings?.length || 0}`);
        if (buildings && buildings.length > 0) {
          buildings.forEach(b => console.log(`     - ${b.name}`));
        }
      }

      // Check fields
      const { data: fields, error: fieldsError } = await supabase
        .from('fields')
        .select('id, name')
        .eq('facility_id', facility.id);

      if (fieldsError) {
        console.log('  ❌ Fields table error:', fieldsError.message);
      } else {
        console.log(`  🏟️  Fields: ${fields?.length || 0}`);
        if (fields && fields.length > 0) {
          fields.forEach(f => console.log(`     - ${f.name}`));
        }
      }

      // Check rooms (get all rooms for buildings in this facility)
      if (buildings && buildings.length > 0) {
        const buildingIds = buildings.map(b => b.id);
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('id, room_number, name')
          .in('building_id', buildingIds);

        if (roomsError) {
          console.log('  ❌ Rooms table error:', roomsError.message);
        } else {
          console.log(`  🚪 Rooms: ${rooms?.length || 0}`);
          if (rooms && rooms.length > 0 && rooms.length <= 5) {
            rooms.forEach(r => console.log(`     - ${r.room_number || r.name}`));
          }
        }
      }
    }

    // Summary
    console.log('\n\n📊 SUMMARY');
    console.log('=' .repeat(60));
    
    // Check if tables exist
    const tables = ['buildings', 'fields', 'rooms'];
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist - needs migration`);
      } else if (error) {
        console.log(`⚠️  Table '${table}' exists but has errors: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run checks
checkFacilityData();
