const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRoomTable() {
  try {
    console.log('Checking room table structure...\n');

    // Get table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'rooms' });

    if (columnsError) {
      console.error('Error getting columns:', columnsError);
      
      // Try alternative approach
      const { data: testData, error: testError } = await supabase
        .from('rooms')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('Error fetching test data:', testError);
      } else {
        console.log('Room table columns (from test query):');
        if (testData && testData.length > 0) {
          console.log(Object.keys(testData[0]));
        } else {
          console.log('No rooms found, but table exists');
        }
      }
    } else {
      console.log('Room table columns:', columns);
    }

    // Check for any existing restroom entries
    console.log('\nChecking for existing restroom entries...');
    const { data: restrooms, error: restroomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_function', 'Restroom');

    if (restroomError) {
      console.error('Error fetching restrooms:', restroomError);
    } else {
      console.log(`Found ${restrooms?.length || 0} restroom entries`);
      if (restrooms && restrooms.length > 0) {
        console.log('Sample restroom:', restrooms[0]);
      }
    }

    // Test insert with minimal data
    console.log('\nTesting minimal room insert...');
    const testRoom = {
      building_id: '1', // This would need to be a valid building ID
      name: 'Test Restroom',
      room_number: 'TEST-001',
      room_function: 'Restroom',
      square_footage: 100
    };

    console.log('Test data:', testRoom);

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkRoomTable(); 