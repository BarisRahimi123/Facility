const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://ahntaamtsypranvnofxy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFresnoState() {
  console.log('=== CHECKING FRESNO STATE ===\n');

  try {
    // Get Fresno State facility
    const { data: facility } = await supabase
      .from('facilities')
      .select('*')
      .eq('name', 'Fresno State')
      .single();
      
    console.log('Facility ID:', facility.id);
    console.log('Facility Name:', facility.name);
    console.log('');

    // Get buildings for Fresno State
    const { data: buildings } = await supabase
        .from('buildings')
        .select('*')
        .eq('facility_id', facility.id);

    console.log('Buildings:', buildings.length);
    buildings.forEach(b => {
      console.log(`  - ${b.name} (ID: ${b.id})`);
        });
    console.log('');
    
    // Get all rooms for these buildings
    const buildingIds = buildings.map(b => b.id);
    const { data: rooms } = await supabase
      .from('rooms')
      .select('*')
      .in('building_id', buildingIds);
      
    console.log('Rooms:', rooms.length);
    if (rooms.length === 0) {
      console.log('  ⚠️  NO ROOMS FOUND IN ANY BUILDING!');
    } else {
      rooms.forEach(room => {
        console.log(`  - Room ${room.room_number}: ${room.room_function} (${room.square_footage} sq ft)`);
        console.log(`    Building: ${buildings.find(b => b.id === room.building_id)?.name}`);
        const isClassroom = room.room_function.toLowerCase().includes('class') || 
                           room.room_function.toLowerCase().includes('lab');
        console.log(`    Is this a classroom? ${isClassroom ? 'YES ✓' : 'NO'}`);
        if (isClassroom) {
          const capacity = Math.floor(room.square_footage / 20);
          console.log(`    Student capacity: ${capacity} students`);
        }
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkFresnoState(); 