const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.error('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.error('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  // Check for building_systems table
  try {
    const { data, error } = await supabase
      .from('building_systems')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ building_systems table exists');
  } catch (error) {
    console.log('❌ building_systems table does not exist:', error.message);
  }

  // Check for renovations table
  try {
    const { data, error } = await supabase
      .from('renovations')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ renovations table exists');
  } catch (error) {
    console.log('❌ renovations table does not exist:', error.message);
  }

  // Check for rooms table and verify it's working
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    console.log(`✅ rooms table exists with ${data.length} rooms`);
    if (data.length > 0) {
      console.log('Sample room:', data[0]);
    }
  } catch (error) {
    console.log('❌ rooms table error:', error.message);
  }
}

checkTables(); 