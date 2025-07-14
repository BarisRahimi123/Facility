const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// CBC Occupancy factors (square feet per person)
const CBC_OCCUPANCY_FACTORS = {
  'Classroom': 20,
  'Laboratory': 50,
  'Library': 50,
  'Auditorium': 15,
  'Gymnasium': 50,
  'Office': 100,
  'Conference': 15,
  'Reception': 30,
  'Break Room': 15,
  'Medical Office': 120,
  'Treatment Room': 240,
  'Patient Room': 200,
  'Storage': 300,
  'Mechanical': 300,
  'Janitorial': 300,
  'Electrical': 300,
  'Restroom': 40,
  'Hallway': 3,
  'Lobby': 15,
  'Cafeteria': 15,
  'Kitchen': 200,
  'Other': 100
};

function calculateCapacity(roomFunction, squareFootage) {
  if (!roomFunction || squareFootage <= 0) {
    return 0;
  }

  const occupancyFactor = CBC_OCCUPANCY_FACTORS[roomFunction] || CBC_OCCUPANCY_FACTORS.Other;
  return Math.floor(squareFootage / occupancyFactor);
}

async function checkAndFixRoomCapacities() {
  try {
    console.log('Checking room capacities...\n');

    // First, find the Engineering Building at Fresno State
    const { data: buildings, error: buildingError } = await supabase
      .from('buildings')
      .select('*')
      .ilike('name', '%Engineering%');

    if (buildingError) {
      console.error('Error fetching buildings:', buildingError);
      return;
    }

    console.log('Found buildings:', buildings?.map(b => `${b.name} (${b.id})`));

    if (!buildings || buildings.length === 0) {
      console.log('No Engineering Building found');
      return;
    }

    const engineeringBuilding = buildings[0];
    console.log(`\nChecking rooms in ${engineeringBuilding.name}...`);

    // Get all rooms in the Engineering Building
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('building_id', engineeringBuilding.id)
      .order('room_number');

    if (roomError) {
      console.error('Error fetching rooms:', roomError);
      return;
    }

    console.log(`\nFound ${rooms?.length || 0} rooms:`);

    let fixCount = 0;
    for (const room of rooms || []) {
      const calculatedCapacity = calculateCapacity(room.room_function, room.square_footage);
      const currentCapacity = room.capacity || 0;
      
      console.log(`\nRoom ${room.room_number}:`);
      console.log(`  Function: ${room.room_function}`);
      console.log(`  Square Footage: ${room.square_footage}`);
      console.log(`  Current Capacity: ${currentCapacity}`);
      console.log(`  Calculated Capacity: ${calculatedCapacity}`);
      
      if (currentCapacity !== calculatedCapacity) {
        console.log(`  ⚠️  NEEDS FIX: ${currentCapacity} → ${calculatedCapacity}`);
        
        // Fix the capacity
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ capacity: calculatedCapacity })
          .eq('id', room.id);

        if (updateError) {
          console.error(`  ❌ Error updating room ${room.room_number}:`, updateError);
        } else {
          console.log(`  ✅ Fixed capacity for room ${room.room_number}`);
          fixCount++;
        }
      } else {
        console.log(`  ✓ Capacity is correct`);
      }
    }

    console.log(`\n${fixCount} room capacities fixed.`);

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkAndFixRoomCapacities(); 