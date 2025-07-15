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

async function checkTables() {
  console.log('Checking staff assignment tables...\n');
  
  // Check staff_room_assignments
  const { data: roomData, error: roomError } = await supabase
    .from('staff_room_assignments')
    .select('*')
    .limit(1);
  
  if (roomError) {
    if (roomError.code === '42P01') {
      console.log('❌ staff_room_assignments table does NOT exist');
      console.log('   Error:', roomError.message);
    } else {
      console.log('⚠️  staff_room_assignments table error:', roomError.message);
    }
  } else {
    console.log('✅ staff_room_assignments table exists');
  }
  
  // Check staff_field_assignments
  const { data: fieldData, error: fieldError } = await supabase
    .from('staff_field_assignments')
    .select('*')
    .limit(1);
  
  if (fieldError) {
    if (fieldError.code === '42P01') {
      console.log('❌ staff_field_assignments table does NOT exist');
      console.log('   Error:', fieldError.message);
    } else {
      console.log('⚠️  staff_field_assignments table error:', fieldError.message);
    }
  } else {
    console.log('✅ staff_field_assignments table exists');
  }
  
  // Check room_blockout_dates
  const { data: blockoutData, error: blockoutError } = await supabase
    .from('room_blockout_dates')
    .select('*')
    .limit(1);
  
  if (blockoutError) {
    if (blockoutError.code === '42P01') {
      console.log('❌ room_blockout_dates table does NOT exist');
      console.log('   Error:', blockoutError.message);
    } else {
      console.log('⚠️  room_blockout_dates table error:', blockoutError.message);
    }
  } else {
    console.log('✅ room_blockout_dates table exists');
  }
  
  console.log('\nTo fix missing tables, apply the migration:');
  console.log('supabase/migrations/20250124_staff_field_room_assignments.sql');
}

checkTables();
