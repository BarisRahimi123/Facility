const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkFieldBlockoutSync() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    console.log('🔍 Checking field blockout synchronization...\n');

    // 1. Get all fields
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('id, name, facility_id')
      .order('name');

    if (fieldsError) {
      console.error('Error fetching fields:', fieldsError);
      return;
    }

    console.log(`📋 Found ${fields?.length || 0} fields\n`);

    if (!fields || fields.length === 0) {
      console.log('No fields found in database');
      return;
    }

    // 2. Get all active blockout dates
    const today = new Date().toISOString().split('T')[0];
    
    const { data: blockouts, error: blockoutsError } = await supabase
      .from('field_blockout_dates')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', today)
      .order('start_date');

    if (blockoutsError) {
      console.error('Error fetching blockouts:', blockoutsError);
      return;
    }

    console.log(`🚫 Found ${blockouts?.length || 0} active/future blockouts\n`);

    // 3. Check blockouts for July 9 and 10 specifically
    const july9 = '2025-07-09';
    const july10 = '2025-07-10';
    
    const julyBlockouts = blockouts?.filter(b => 
      (b.start_date <= july9 && b.end_date >= july9) ||
      (b.start_date <= july10 && b.end_date >= july10)
    ) || [];

    console.log(`📅 Blockouts affecting July 9-10, 2025:`);
    if (julyBlockouts.length === 0) {
      console.log('  No blockouts found for these dates');
    } else {
      julyBlockouts.forEach(blockout => {
        const field = fields.find(f => f.id === blockout.field_id);
        console.log(`  - Field: ${field?.name || 'Unknown'}`);
        console.log(`    Dates: ${blockout.start_date} to ${blockout.end_date}`);
        console.log(`    Reason: ${blockout.reason}`);
        console.log(`    Status: ${blockout.status}`);
        console.log(`    Created: ${new Date(blockout.created_at).toLocaleString()}\n`);
      });
    }

    // 4. Check which fields are blocked out today
    console.log(`\n🔒 Fields blocked out today (${today}):`);
    const todayBlockouts = blockouts?.filter(b => 
      b.start_date <= today && b.end_date >= today
    ) || [];

    if (todayBlockouts.length === 0) {
      console.log('  No fields are blocked out today');
    } else {
      todayBlockouts.forEach(blockout => {
        const field = fields.find(f => f.id === blockout.field_id);
        console.log(`  - ${field?.name || 'Unknown'} (${blockout.reason})`);
      });
    }

    // 5. Show sample data structure for debugging
    if (blockouts && blockouts.length > 0) {
      console.log('\n📊 Sample blockout data structure:');
      console.log(JSON.stringify(blockouts[0], null, 2));
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkFieldBlockoutSync(); 