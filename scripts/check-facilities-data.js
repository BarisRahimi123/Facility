import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFacilities() {
  try {
    console.log('🔍 Checking facilities data...\n');
    
    const { data, error, count } = await supabase
      .from('facilities')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.log('❌ Database error:', error.message);
      return;
    }
    
    console.log('📊 Facilities in database:', count);
    if (data && data.length > 0) {
      console.log('✅ Found facilities:');
      data.forEach((facility, index) => {
        console.log(`  ${index + 1}. ${facility.name} (Status: ${facility.status || 'unknown'})`);
      });
    } else {
      console.log('❌ No facilities found in database');
      console.log('\n💡 Possible reasons:');
      console.log('  • No facilities have been created yet');
      console.log('  • All facilities are inactive/deleted');
      console.log('  • Database connection issues');
      console.log('  • Wrong table name or permissions');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkFacilities();
