const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting authentication hierarchy migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250129_authentication_hierarchy.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Migration file found:', migrationPath);
    console.log('\n🔧 This migration will:');
    console.log('  - Create user role hierarchy (master_admin, sub_master, staff, etc.)');
    console.log('  - Add user invitation system');
    console.log('  - Update existing roles to new structure');
    console.log('  - Set 85baris@gmail.com as master_admin');
    console.log('  - Create invitation functions and policies\n');

    // Apply the migration via Supabase dashboard
    console.log('⚠️  IMPORTANT: This migration must be run via the Supabase Dashboard');
    console.log('\n📋 Steps to apply:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the migration from:', migrationPath);
    console.log('5. Run the query');
    console.log('\n✅ After applying the migration:');
    console.log('  - Master admin (85baris@gmail.com) can invite sub-master admins');
    console.log('  - Sub-master admins can invite facility staff');
    console.log('  - Public users can sign up as renters');
    console.log('  - Invitation system will be active');

    // Test current user roles
    console.log('\n📊 Current user roles in database:');
    const { data: users, error } = await supabase
      .from('users')
      .select('email, role')
      .order('created_at', { ascending: false })
      .limit(10);

    if (users) {
      users.forEach(user => {
        console.log(`  - ${user.email}: ${user.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMigration(); 