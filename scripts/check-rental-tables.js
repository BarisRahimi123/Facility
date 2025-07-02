import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the .env.local file
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTables() {
  console.log('Checking for rental and reservation tables...\n');

  const tablesToCheck = [
    'organizations',
    'users',
    'rate_categories',
    'reservations',
    'reservation_slots',
    'additional_fees',
    'payments',
    'insurance_policies',
    'work_orders',
    'reservation_history'
  ];

  let missingTables = [];
  let existingTables = [];

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}' does not exist`);
          missingTables.push(table);
        } else {
          console.log(`⚠️  Table '${table}' exists but has errors: ${error.message}`);
          existingTables.push(table);
        }
      } else {
        console.log(`✅ Table '${table}' exists`);
        existingTables.push(table);
      }
    } catch (err) {
      console.error(`Error checking table '${table}':`, err);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Existing tables: ${existingTables.length}`);
  console.log(`Missing tables: ${missingTables.length}`);

  if (missingTables.length > 0) {
    console.log('\n⚠️  The rental/reservation tables have not been created yet!');
    console.log('\nTo apply the migration, follow these steps:');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to the SQL Editor');
    console.log('4. Click "New query"');
    console.log('5. Copy and paste the contents of: supabase/migrations/20250123_rental_reservation_system_complete_fixed.sql');
    console.log('6. Click "Run" to execute the migration');
    console.log('\nAlternatively, if you have Supabase CLI configured, run:');
    console.log('npx supabase db push');
  } else {
    console.log('\n✅ All rental/reservation tables exist!');
    console.log('\nYou can now access:');
    console.log('- Rentals Marketplace: http://localhost:3000/rentals');
    console.log('- Admin Reservations: http://localhost:3000/admin/reservations');
  }
}

checkTables().catch(console.error); 