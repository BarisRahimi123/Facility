import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFacilityRooms() {
  try {
    // Get all facilities
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, rooms, active_issues, occupancy_rate')
      .order('name');

    if (facilityError) {
      console.error('Error fetching facilities:', facilityError);
      return;
    }

    console.log('Facility data in database:');
    console.log('=====================================\n');

    for (const facility of facilities) {
      console.log(`Facility: ${facility.name}`);
      console.log(`  ID: ${facility.id}`);
      console.log(`  Rooms field: ${facility.rooms || 'NULL'}`);
      console.log(`  Active Issues field: ${facility.active_issues || 'NULL'}`);
      console.log(`  Occupancy Rate field: ${facility.occupancy_rate || 'NULL'}`);
      
      // Now count actual rooms from buildings
      const { data: buildings, error: buildingError } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('facility_id', facility.id);

      if (buildingError) {
        console.error(`  Error fetching buildings: ${buildingError.message}`);
        continue;
      }

      let totalRooms = 0;
      console.log(`  Buildings: ${buildings.length}`);

      for (const building of buildings) {
        const { data: rooms, error: roomError } = await supabase
          .from('rooms')
          .select('id')
          .eq('building_id', building.id);

        if (roomError) {
          console.error(`    Error fetching rooms for building ${building.name}: ${roomError.message}`);
          continue;
        }

        console.log(`    - ${building.name}: ${rooms.length} rooms`);
        totalRooms += rooms.length;
      }

      console.log(`  ACTUAL TOTAL ROOMS: ${totalRooms}`);
      console.log(`  MISMATCH: ${facility.rooms !== totalRooms ? `YES (DB shows ${facility.rooms || 'NULL'}, actual is ${totalRooms})` : 'No'}`);
      console.log('');
    }

    // Check if facilities table has the rooms column
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'facilities' });

    if (!columnsError && columns) {
      console.log('\nFacilities table columns:');
      const relevantColumns = columns.filter(col => 
        ['rooms', 'active_issues', 'occupancy_rate', 'facility_condition_index'].includes(col.column_name)
      );
      relevantColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkFacilityRooms();





