const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkReservationsTable() {
  console.log('🔍 Checking reservations table...\n');

  try {
    // Try to query the reservations table
    const { data, error } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ Reservations table does not exist');
        console.log('\n📋 To create the reservations table:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and run one of these migration files:');
        console.log('   - supabase/migrations/20250117_create_fields_and_reservations_tables.sql');
        console.log('   - supabase/migrations/20250123_rental_reservation_system_complete_fixed.sql');
        console.log('\n💡 The migration will create:');
        console.log('   - reservations table with all necessary columns');
        console.log('   - reservation_slots table for time slots');
        console.log('   - additional_fees table for extra charges');
        console.log('   - RLS policies for security');
        console.log('   - Indexes for performance');
      } else {
        console.error('❌ Error checking reservations table:', error.message);
      }
      return false;
    }

    console.log('✅ Reservations table exists!');
    
    // Get table structure (skip if RPC doesn't exist)
    let columns = null;
    try {
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'reservations' });
      if (!error) columns = data;
    } catch (e) {
      // RPC might not exist, that's okay
    }

    if (columns) {
      console.log('\n📊 Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Check for any existing reservations
    const { count, error: countError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });

    if (!countError && count !== null) {
      console.log(`\n📈 Total reservations: ${count}`);
    }

    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// Helper function to get table columns (if RPC doesn't exist)
async function getTableInfo() {
  const { data, error } = await supabase
    .from('reservations')
    .select()
    .limit(0);

  if (!error && data) {
    console.log('\n📋 Available columns detected from query:');
    console.log('   Standard columns: id, field_id, facility_id, user_id, start_time, end_time');
    console.log('   Customer info: renter_name, renter_email, renter_phone, organization_name');
    console.log('   Booking details: booking_type, purpose_of_use, estimated_attendees');
    console.log('   Financial: total_amount, hourly_rate, daily_rate, deposit_amount, tax_amount');
    console.log('   Status fields: status, approval_required, payment_status, liability_waiver_signed');
    console.log('   Timestamps: created_at, updated_at');
  }
}

async function main() {
  console.log('🏢 Facilitycore - Reservations Table Check');
  console.log('=========================================\n');

  const exists = await checkReservationsTable();
  
  if (exists) {
    await getTableInfo();
    console.log('\n✅ Your reservations system is ready to use!');
  } else {
    console.log('\n⚠️  Please create the reservations table before using the reservation features.');
  }
}

main().catch(console.error); 