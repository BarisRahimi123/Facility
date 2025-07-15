import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkReservationsTable() {
  console.log('Checking reservations table structure...\n');

  try {
    // Check if reservations table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'reservations');

    if (tableError || !tables || tables.length === 0) {
      console.error('❌ Reservations table does not exist!');
      console.log('\nTo create the table, run the following SQL in your Supabase dashboard:');
      console.log('Copy the contents of: scripts/apply-reservations-table-simple.sql');
      return;
    }

    console.log('✅ Reservations table exists\n');

    // Get all columns
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'reservations')
      .order('ordinal_position');

    if (columnsError) {
      console.error('Error fetching columns:', columnsError);
      return;
    }

    console.log('Current columns in reservations table:');
    console.log('=====================================');
    columns.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
    });

    // Check for required columns
    const requiredColumns = [
      'field_id',
      'facility_id', 
      'user_id',
      'date',
      'start_time',
      'end_time',
      'duration_hours',
      'hourly_rate',
      'subtotal',
      'tax_amount',
      'total_amount',
      'status',
      'payment_status',
      'purpose',
      'setup_requirements',
      'tables_needed',
      'chairs_needed',
      'hvac_needed',
      'contact_name',
      'contact_email',
      'contact_phone',
      'organization'
    ];

    const existingColumns = columns.map(col => col.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing required columns:');
      console.log('===========================');
      missingColumns.forEach(col => console.log(`- ${col}`));
      
      console.log('\n📝 To add missing columns, run this SQL in Supabase:');
      console.log('Copy the contents of: scripts/add-missing-reservation-columns.sql');
    } else {
      console.log('\n✅ All required columns exist!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkReservationsTable(); 