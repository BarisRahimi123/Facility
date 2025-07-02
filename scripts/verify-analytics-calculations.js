const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CBC Occupancy factors (matching the app)
const CBC_OCCUPANCY_FACTORS = {
  'Classroom': 20,
  'Office': 100,
  'Conference': 15,
  'Meeting Room': 15,
  'Storage': 300,
  'Restroom': 40,
  'Other': 100,
};

function calculateCapacity(roomFunction, squareFootage) {
  const factor = CBC_OCCUPANCY_FACTORS[roomFunction] || CBC_OCCUPANCY_FACTORS.Other;
  return Math.floor(squareFootage / factor);
}

async function verifyAnalytics() {
  console.log('=== ANALYTICS VERIFICATION REPORT ===\n');

  try {
    // Get all facilities
    const { data: facilities } = await supabase
      .from('facilities')
      .select('*')
      .order('name');

    // Get all buildings
    const { data: buildings } = await supabase
      .from('buildings')
      .select('*');
      
    // Get all rooms
    const { data: rooms } = await supabase
      .from('rooms')
      .select('*');
    
    console.log('=== DATABASE SUMMARY ===');
    console.log(`Total Facilities: ${facilities.length}`);
    console.log(`Total Buildings: ${buildings.length}`);
    console.log(`Total Rooms: ${rooms.length}`);
    console.log('');
    
    // Process each facility
    for (const facility of facilities) {
      console.log(`\n=== ${facility.name.toUpperCase()} ===`);
      console.log(`Facility ID: ${facility.id}`);

      // Get buildings for this facility
      const facilityBuildings = buildings.filter(b => b.facility_id === facility.id);
      console.log(`Buildings: ${facilityBuildings.length}`);
      
      // Get rooms for this facility
      const buildingIds = facilityBuildings.map(b => b.id);
      const facilityRooms = rooms.filter(r => buildingIds.includes(r.building_id));
      console.log(`Total Rooms: ${facilityRooms.length}`);
      
      if (facilityRooms.length === 0) {
        console.log('  ⚠️  NO ROOMS IN THIS FACILITY!');
        console.log('  💡 Add rooms to buildings to see capacity calculations.');
        continue;
      }
      
      // Categorize rooms
      const classrooms = [];
      const staffSpaces = [];
      const utilitySpaces = [];
      let studentCapacity = 0;
      let staffCapacity = 0;
      
      facilityRooms.forEach(room => {
        const roomFunction = (room.room_function || '').toLowerCase();
        
        // Classroom detection
        if (roomFunction.includes('classroom') || 
            roomFunction.includes('laboratory') || 
            roomFunction.includes('lab') ||
            roomFunction.includes('library') ||
            roomFunction.includes('auditorium')) {
          classrooms.push(room);
          const capacity = Math.floor((room.square_footage || 0) / 20);
          studentCapacity += capacity;
        }
        // Staff space detection
        else if (roomFunction.includes('office') || 
                 roomFunction.includes('conference') ||
                 roomFunction.includes('meeting') ||
                 roomFunction.includes('admin') ||
                 roomFunction.includes('reception')) {
          staffSpaces.push(room);
          const factor = (roomFunction.includes('conference') || roomFunction.includes('meeting')) ? 15 : 100;
          const capacity = Math.floor((room.square_footage || 0) / factor);
          staffCapacity += capacity;
          }
        // Utility spaces
        else {
          utilitySpaces.push(room);
        }
      });

      console.log('\nRoom Breakdown:');
      console.log(`  Classrooms/Labs: ${classrooms.length}`);
      classrooms.forEach(r => {
        const cap = Math.floor(r.square_footage / 20);
        console.log(`    - ${r.room_number}: ${r.room_function} (${r.square_footage} sq ft) = ${cap} students`);
      });
      
      console.log(`  Staff Spaces: ${staffSpaces.length}`);
      staffSpaces.forEach(r => {
        const factor = r.room_function.toLowerCase().includes('conference') || 
                      r.room_function.toLowerCase().includes('meeting') ? 15 : 100;
        const cap = Math.floor(r.square_footage / factor);
        console.log(`    - ${r.room_number}: ${r.room_function} (${r.square_footage} sq ft) = ${cap} staff`);
      });
      
      console.log(`  Utility/Other: ${utilitySpaces.length}`);
      utilitySpaces.forEach(r => {
        console.log(`    - ${r.room_number}: ${r.room_function} (${r.square_footage} sq ft)`);
      });
      
      console.log('\nCapacity Summary:');
      console.log(`  📚 Student Capacity: ${studentCapacity} students`);
      console.log(`  👥 Staff Capacity: ${staffCapacity} staff`);
      
      if (studentCapacity === 0 && classrooms.length === 0) {
        console.log('\n  ❌ NO STUDENT CAPACITY - No classrooms in this facility!');
        console.log('  💡 To add student capacity, create rooms with functions like:');
        console.log('     - Classroom, Laboratory, Library, Auditorium');
      }
    }
    
    // System-wide totals
    console.log('\n\n=== SYSTEM-WIDE TOTALS ===');
    let totalStudentCap = 0;
    let totalStaffCap = 0;
    let totalClassrooms = 0;
    let totalStaffRooms = 0;
    
    rooms.forEach(room => {
      const roomFunction = (room.room_function || '').toLowerCase();
      
      if (roomFunction.includes('classroom') || 
          roomFunction.includes('laboratory') || 
          roomFunction.includes('lab') ||
          roomFunction.includes('library') ||
          roomFunction.includes('auditorium')) {
        totalClassrooms++;
        totalStudentCap += Math.floor((room.square_footage || 0) / 20);
      } else if (roomFunction.includes('office') || 
                 roomFunction.includes('conference') ||
                 roomFunction.includes('meeting') ||
                 roomFunction.includes('admin') ||
                 roomFunction.includes('reception')) {
        totalStaffRooms++;
        const factor = (roomFunction.includes('conference') || roomFunction.includes('meeting')) ? 15 : 100;
        totalStaffCap += Math.floor((room.square_footage || 0) / factor);
      }
    });
    
    console.log(`Total Classrooms/Labs: ${totalClassrooms}`);
    console.log(`Total Student Capacity: ${totalStudentCap} students`);
    console.log(`Total Staff Rooms: ${totalStaffRooms}`);
    console.log(`Total Staff Capacity: ${totalStaffCap} staff`);
    
    if (totalStudentCap < 50) {
      console.log('\n⚠️  LOW STUDENT CAPACITY DETECTED!');
      console.log('Most facilities have few or no classrooms.');
      console.log('Add more educational spaces to increase student capacity.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyAnalytics().then(() => {
  console.log('\n🏁 Verification complete!');
  process.exit(0);
}); 