const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStaffAssignmentTables() {
  console.log('🔍 Checking staff assignment tables...\n');

  try {
    // Check if staff_field_assignments table exists
    console.log('📋 Checking staff_field_assignments table...');
    const { data: fieldAssignments, error: fieldError } = await supabase
      .from('staff_field_assignments')
      .select('*')
      .limit(5);

    if (fieldError) {
      console.log('❌ staff_field_assignments table not found or error:', fieldError.message);
    } else {
      console.log(`✅ staff_field_assignments table exists with ${fieldAssignments.length} records`);
      if (fieldAssignments.length > 0) {
        console.log('Sample record:', JSON.stringify(fieldAssignments[0], null, 2));
      }
    }

    // Check if staff_room_assignments table exists  
    console.log('\n📋 Checking staff_room_assignments table...');
    const { data: roomAssignments, error: roomError } = await supabase
      .from('staff_room_assignments')
      .select('*')
      .limit(5);

    if (roomError) {
      console.log('❌ staff_room_assignments table not found or error:', roomError.message);
    } else {
      console.log(`✅ staff_room_assignments table exists with ${roomAssignments.length} records`);
      if (roomAssignments.length > 0) {
        console.log('Sample record:', JSON.stringify(roomAssignments[0], null, 2));
      }
    }

    // Check if room_blockout_dates table exists
    console.log('\n📋 Checking room_blockout_dates table...');
    const { data: roomBlockouts, error: blockoutError } = await supabase
      .from('room_blockout_dates')
      .select('*')
      .limit(5);

    if (blockoutError) {
      console.log('❌ room_blockout_dates table not found or error:', blockoutError.message);
    } else {
      console.log(`✅ room_blockout_dates table exists with ${roomBlockouts.length} records`);
      if (roomBlockouts.length > 0) {
        console.log('Sample record:', JSON.stringify(roomBlockouts[0], null, 2));
      }
    }

    // Check available users for assignment
    console.log('\n👥 Checking available users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['staff', 'manager', 'coordinator'])
      .limit(5);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`✅ Found ${users.length} assignable users`);
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.full_name || 'No name'}`);
      });
    }

    // Check available fields and rooms
    console.log('\n🏟️ Checking available fields...');
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('id, name, facility_id')
      .limit(3);

    if (fieldsError) {
      console.log('❌ Error fetching fields:', fieldsError.message);
    } else {
      console.log(`✅ Found ${fields.length} fields available for assignment`);
      fields.forEach(field => {
        console.log(`- ${field.name} (ID: ${field.id})`);
      });
    }

    console.log('\n🏠 Checking available rooms...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_number, building_id')
      .limit(3);

    if (roomsError) {
      console.log('❌ Error fetching rooms:', roomsError.message);
    } else {
      console.log(`✅ Found ${rooms.length} rooms available for assignment`);
      rooms.forEach(room => {
        console.log(`- Room ${room.room_number} (ID: ${room.id})`);
      });
    }

  } catch (error) {
    console.error('💥 Error checking database:', error);
  }
}

// Run the check
checkStaffAssignmentTables().then(() => {
  console.log('\n✨ Staff assignment system check complete!');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 