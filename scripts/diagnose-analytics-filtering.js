const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ahntaamtsypranvnofxy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseAnalyticsFiltering() {
  console.log('=== ANALYTICS DIAGNOSIS ===');
  console.log('');

  try {
    // 1. Fetch all facilities
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('*')
      .order('name');

    if (facilitiesError) throw facilitiesError;

    console.log(`Total Facilities: ${facilities.length}`);
    facilities.forEach(f => {
      console.log(`  - ${f.name} (ID: ${f.id})`);
    });
    console.log('');

    // 2. Fetch all buildings with facility mapping
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .order('name');

    if (buildingsError) throw buildingsError;
    
    console.log(`Total Buildings: ${buildings.length}`);
    console.log('');

    // Show facility-building relationships
    facilities.forEach(facility => {
      const facilityBuildings = buildings.filter(b => b.facility_id === facility.id);
      console.log(`${facility.name} has ${facilityBuildings.length} buildings:`);
      facilityBuildings.forEach(b => {
        console.log(`  - ${b.name} (${b.building_type}, ${b.square_footage} sq ft)`);
      });
      console.log('');
    });
    
    // 3. Fetch all rooms with details
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');
      
    if (roomsError) throw roomsError;
    
    console.log(`Total Rooms: ${rooms.length}`);
    console.log('');
    
    // Show room functions and calculate capacity
    console.log('=== ROOM ANALYSIS ===');
    const roomFunctions = [...new Set(rooms.map(r => r.room_function))];
    console.log('Unique Room Functions Found:');
    roomFunctions.forEach(func => {
      const count = rooms.filter(r => r.room_function === func).length;
      console.log(`  - "${func}": ${count} rooms`);
        });
    console.log('');

    // Analyze classrooms specifically
    console.log('=== CLASSROOM ANALYSIS ===');
    const classroomKeywords = ['classroom', 'class', 'laboratory', 'lab', 'library', 'auditorium', 'gymnasium'];
    let totalClassroomCapacity = 0;
    let classroomCount = 0;
    
    rooms.forEach(room => {
      const roomFunction = (room.room_function || '').toLowerCase();
      const isClassroom = classroomKeywords.some(keyword => roomFunction.includes(keyword));
      
      if (isClassroom || room.room_function === 'Classroom') {
        classroomCount++;
        // Standard classroom capacity: 20 sq ft per student
        const capacity = Math.floor((room.square_footage || 0) / 20);
        totalClassroomCapacity += capacity;
        console.log(`  - Room ${room.room_number}: ${room.room_function} (${room.square_footage} sq ft) = ${capacity} students`);
      }
    });
    
    console.log(`\nTotal Classrooms: ${classroomCount}`);
    console.log(`Total Classroom Capacity: ${totalClassroomCapacity} students`);
    console.log('');
    
    // Analyze staff spaces
    console.log('=== STAFF SPACE ANALYSIS ===');
    const staffKeywords = ['office', 'conference', 'meeting', 'reception', 'admin', 'staff', 'break'];
    let totalStaffCapacity = 0;
    let staffRoomCount = 0;
    
    rooms.forEach(room => {
      const roomFunction = (room.room_function || '').toLowerCase();
      const isStaffSpace = staffKeywords.some(keyword => roomFunction.includes(keyword));
      
      if (isStaffSpace) {
        staffRoomCount++;
        // Office: 100 sq ft per person, Conference: 15 sq ft per person
        const factor = roomFunction.includes('conference') || roomFunction.includes('meeting') ? 15 : 100;
        const capacity = Math.floor((room.square_footage || 0) / factor);
        totalStaffCapacity += capacity;
        console.log(`  - Room ${room.room_number}: ${room.room_function} (${room.square_footage} sq ft) = ${capacity} staff`);
      }
    });
    
    console.log(`\nTotal Staff Rooms: ${staffRoomCount}`);
    console.log(`Total Staff Capacity: ${totalStaffCapacity} staff`);
    console.log('');
    
    // Summary by facility
    console.log('=== CAPACITY BY FACILITY ===');
    for (const facility of facilities) {
      const facilityBuildings = buildings.filter(b => b.facility_id === facility.id);
      const buildingIds = facilityBuildings.map(b => b.id);
      const facilityRooms = rooms.filter(r => buildingIds.includes(r.building_id));
      
      let classroomCap = 0;
      let staffCap = 0;
      
      facilityRooms.forEach(room => {
        const roomFunction = (room.room_function || '').toLowerCase();
        
        if (classroomKeywords.some(k => roomFunction.includes(k)) || room.room_function === 'Classroom') {
          classroomCap += Math.floor((room.square_footage || 0) / 20);
        } else if (staffKeywords.some(k => roomFunction.includes(k))) {
          const factor = roomFunction.includes('conference') || roomFunction.includes('meeting') ? 15 : 100;
          staffCap += Math.floor((room.square_footage || 0) / factor);
        }
      });
      
      console.log(`${facility.name}:`);
      console.log(`  - Buildings: ${facilityBuildings.length}`);
      console.log(`  - Rooms: ${facilityRooms.length}`);
      console.log(`  - Student Capacity: ${classroomCap}`);
      console.log(`  - Staff Capacity: ${staffCap}`);
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

diagnoseAnalyticsFiltering(); 