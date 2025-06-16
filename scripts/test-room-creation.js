const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRoomCreation() {
  try {
    // First, get a building to add a room to
    const { data: buildings, error: buildingError } = await supabase
      .from('buildings')
      .select('id, name')
      .limit(1);

    if (buildingError || !buildings || buildings.length === 0) {
      console.error('No buildings found to test with');
      return;
    }

    const building = buildings[0];
    console.log(`\nTesting room creation for building: ${building.name} (${building.id})`);

    // Create a test room
    const testRoom = {
      building_id: building.id,
      name: 'TEST-' + Date.now(),
      room_number: 'TEST-' + Date.now(),
      room_function: 'Conference',
      square_footage: 250,
      capacity: 10,
      floor: '2'
    };

    console.log('\nCreating test room:', testRoom);

    const { data: newRoom, error: createError } = await supabase
      .from('rooms')
      .insert([testRoom])
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create room:', createError);
      return;
    }

    console.log('✅ Room created successfully:', newRoom);

    // Verify the room was created
    const { data: verifyRoom, error: verifyError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', newRoom.id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify room:', verifyError);
      return;
    }

    console.log('✅ Room verified in database:', verifyRoom);

    // Get all rooms for this building
    const { data: allRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('building_id', building.id)
      .order('created_at', { ascending: false });

    if (!roomsError) {
      console.log(`\n✅ Building now has ${allRooms.length} rooms`);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRoomCreation(); 