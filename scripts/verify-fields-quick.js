const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('Checking fields tables...\n');
  
  const tables = ['fields', 'reservations', 'field_blackout_dates'];
  let allGood = true;
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    
    if (error && error.code === '42P01') {
      console.log(`❌ ${table}`);
      allGood = false;
    } else {
      console.log(`✅ ${table}`);
    }
  }
  
  if (allGood) {
    console.log('\n🎉 SUCCESS! All tables created.');
    console.log('🔄 Now refresh your browser to see the Fields module!\n');
  } else {
    console.log('\n❌ Some tables are still missing.');
    console.log('📋 Please run the migration in Supabase.\n');
  }
}

verify(); 