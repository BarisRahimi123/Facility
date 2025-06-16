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
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250115_create_building_systems_renovations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Running ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      
      // Use raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).single();

      if (error) {
        // Try direct execution as fallback
        console.log('Direct RPC failed, trying alternative method...');
        // For now, we'll just log the statement
        console.log('Statement:', statement.substring(0, 100) + '...');
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    console.log('\n✅ Migration completed!');
    
    // Verify tables were created
    console.log('\nVerifying tables...');
    
    try {
      await supabase.from('building_systems').select('count').limit(1);
      console.log('✅ building_systems table created successfully');
    } catch (e) {
      console.log('❌ building_systems table verification failed');
    }

    try {
      await supabase.from('renovations').select('count').limit(1);
      console.log('✅ renovations table created successfully');
    } catch (e) {
      console.log('❌ renovations table verification failed');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Note: Since we can't execute raw SQL directly through Supabase JS client,
// you'll need to run this migration through Supabase dashboard or CLI
console.log('\n⚠️  IMPORTANT: Supabase JS client cannot execute raw SQL directly.');
console.log('Please run the migration using one of these methods:');
console.log('\n1. Supabase Dashboard:');
console.log('   - Go to your Supabase project dashboard');
console.log('   - Navigate to SQL Editor');
console.log('   - Copy and paste the contents of:');
console.log('   supabase/migrations/20250115_create_building_systems_renovations.sql');
console.log('   - Click "Run"\n');
console.log('2. Supabase CLI:');
console.log('   - Install Supabase CLI: npm install -g supabase');
console.log('   - Run: supabase db push\n');

// Still check if tables exist
async function checkTables() {
  console.log('\nChecking current table status...');
  
  try {
    const { error: systemsError } = await supabase
      .from('building_systems')
      .select('*')
      .limit(1);
    
    if (systemsError) {
      console.log('❌ building_systems table does not exist');
    } else {
      console.log('✅ building_systems table already exists');
    }
  } catch (error) {
    console.log('❌ building_systems table does not exist');
  }

  try {
    const { error: renovationsError } = await supabase
      .from('renovations')
      .select('*')
      .limit(1);
    
    if (renovationsError) {
      console.log('❌ renovations table does not exist');
    } else {
      console.log('✅ renovations table already exists');
    }
  } catch (error) {
    console.log('❌ renovations table does not exist');
  }
}

checkTables(); 