import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssignmentTables() {
  try {
    console.log('🔍 Checking staff assignment tables...\n');

    // Check staff_room_assignments table
    console.log('📋 Checking staff_room_assignments table...');
    const { data: roomAssignments, error: roomError } = await supabase
      .from('staff_room_assignments')
      .select('*')
      .limit(5);

    if (roomError) {
      console.error('❌ staff_room_assignments table error:', roomError.message);
    } else {
      console.log('✅ staff_room_assignments table exists');
      console.log(`   Found ${roomAssignments.length} assignments`);
      if (roomAssignments.length > 0) {
        console.log('   Sample data:', JSON.stringify(roomAssignments[0], null, 2));
      }
    }

    // Check staff_field_assignments table
    console.log('\n📋 Checking staff_field_assignments table...');
    const { data: fieldAssignments, error: fieldError } = await supabase
      .from('staff_field_assignments')
      .select('*')
      .limit(5);

    if (fieldError) {
      console.error('❌ staff_field_assignments table error:', fieldError.message);
    } else {
      console.log('✅ staff_field_assignments table exists');
      console.log(`   Found ${fieldAssignments.length} assignments`);
      if (fieldAssignments.length > 0) {
        console.log('   Sample data:', JSON.stringify(fieldAssignments[0], null, 2));
      }
    }

    // Check room_blockout_dates table
    console.log('\n📋 Checking room_blockout_dates table...');
    const { data: blockouts, error: blockoutError } = await supabase
      .from('room_blockout_dates')
      .select('*')
      .limit(5);

    if (blockoutError) {
      console.error('❌ room_blockout_dates table error:', blockoutError.message);
    } else {
      console.log('✅ room_blockout_dates table exists');
      console.log(`   Found ${blockouts.length} blockouts`);
    }

    // Check available users for assignment
    console.log('\n👥 Checking available users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .limit(10);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      console.log(`   Found ${users.length} users`);
      users.forEach(user => {
        console.log(`   - ${user.full_name || 'No name'} (${user.email}) - ${user.role}`);
      });
    }

    // Check rooms for assignment
    console.log('\n🏠 Checking available rooms...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select(`
        id,
        room_number,
        room_function,
        building_id,
        buildings (
          name,
          facility_id,
          facilities (
            name
          )
        )
      `)
      .limit(5);

    if (roomsError) {
      console.error('❌ Rooms query error:', roomsError.message);
    } else {
      console.log('✅ Rooms data accessible');
      console.log(`   Found ${rooms.length} rooms`);
      rooms.forEach(room => {
        console.log(`   - Room ${room.room_number} (${room.room_function}) in ${room.buildings.name}`);
      });
    }

    console.log('\n🎉 Assignment system check complete!');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAssignmentTables(); 