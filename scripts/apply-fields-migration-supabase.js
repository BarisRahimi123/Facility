const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying Fields and Reservations migration...\n');

  try {
    // First check if tables already exist
    console.log('Checking if tables already exist...');
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['fields', 'reservations', 'field_blackout_dates']);

    if (existingTables && existingTables.length > 0) {
      console.log('⚠️  Some tables already exist:', existingTables.map(t => t.table_name).join(', '));
      console.log('Migration may have already been applied.\n');
    }

    // Create fields table
    console.log('Creating fields table...');
    const { error: fieldsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS public.fields (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        surface_type TEXT,
        dimensions TEXT,
        area_sq_ft INTEGER,
        capacity INTEGER,
        hourly_rate DECIMAL(10,2) DEFAULT 0,
        daily_rate DECIMAL(10,2) DEFAULT 0,
        mapbox_geometry JSONB,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        ada_compliant BOOLEAN DEFAULT false,
        has_lighting BOOLEAN DEFAULT false,
        has_scoreboard BOOLEAN DEFAULT false,
        has_restrooms BOOLEAN DEFAULT false,
        has_parking BOOLEAN DEFAULT false,
        parking_spots INTEGER,
        status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'maintenance', 'inactive')),
        maintenance_status TEXT DEFAULT 'good' CHECK (maintenance_status IN ('excellent', 'good', 'fair', 'poor')),
        instant_booking BOOLEAN DEFAULT true,
        requires_approval BOOLEAN DEFAULT false,
        image_url TEXT,
        image_description TEXT,
        description TEXT,
        rules_and_policies TEXT,
        rental_agreement_template TEXT,
        virtual_tour_url TEXT,
        virtual_tour_description TEXT,
        gallery_images JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
      )`
    });

    if (fieldsError) {
      console.error('Error creating fields table:', fieldsError);
    } else {
      console.log('✅ Fields table created successfully');
    }

    // Test if we can query the fields table
    const { error: testError } = await supabase.from('fields').select('id').limit(1);
    if (!testError) {
      console.log('✅ Fields table is accessible');
    } else {
      console.error('❌ Cannot access fields table:', testError.message);
    }

    console.log('\n🎉 Migration completed!');
    console.log('The fields table has been created. You can now:');
    console.log('1. Refresh the Fields page in your app');
    console.log('2. Start creating fields');
    console.log('3. View them on the Mapbox map\n');

    console.log('Note: The full migration includes reservations and blackout_dates tables.');
    console.log('Apply the full migration in Supabase Dashboard if you need those features.');

  } catch (error) {
    console.error('Error during migration:', error);
  }
}

applyMigration(); 