import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFacilities() {
  console.log('🔍 Checking all facilities in the database...\n');

  try {
    // Get ALL facilities (no filters)
    const { data: allFacilities, error: allError } = await supabase
      .from('facilities')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching facilities:', allError);
      return;
    }

    console.log(`📊 Total facilities in database: ${allFacilities?.length || 0}\n`);

    if (allFacilities && allFacilities.length > 0) {
      // Group by status
      const statusGroups = {};
      allFacilities.forEach(facility => {
        const status = facility.status || 'no_status';
        if (!statusGroups[status]) {
          statusGroups[status] = [];
        }
        statusGroups[status].push(facility);
      });

      console.log('📈 Facilities by status:');
      console.log('=' .repeat(50));
      Object.entries(statusGroups).forEach(([status, facilities]) => {
        console.log(`\n${status.toUpperCase()}: ${facilities.length} facilities`);
        facilities.forEach(f => {
          console.log(`  - ${f.name} (ID: ${f.id.substring(0, 8)}...)`);
        });
      });

      // Check for active facilities specifically
      console.log('\n🟢 Active facilities count:', statusGroups['active']?.length || 0);
      
      // Show first facility details for debugging
      console.log('\n📝 Sample facility details:');
      console.log(JSON.stringify(allFacilities[0], null, 2));
    } else {
      console.log('⚠️  No facilities found in the database');
      console.log('   You may need to create facilities first');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run checks
checkFacilities();
