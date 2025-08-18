const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersTable() {
  console.log('🔍 Checking users table...\n');
  
  try {
    // Check if users table exists
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      if (tablesError.message.includes('relation') && tablesError.message.includes('does not exist')) {
        console.log('❌ Users table does not exist');
        console.log('\n📋 To create the users table:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of scripts/check-and-create-users-table.sql');
        console.log('4. Click "Run" to execute the SQL');
        return false;
      } else {
        console.error('❌ Error checking users table:', tablesError.message);
        return false;
      }
    }
    
    console.log('✅ Users table exists');
    
    // Count users
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting users:', countError.message);
    } else {
      console.log(`📊 Total users in database: ${count || 0}`);
    }
    
    // Check for master admin
    const { data: masterAdmin, error: adminError } = await supabase
      .from('users')
      .select('email, full_name, role')
      .eq('email', '85baris@gmail.com')
      .single();
    
    if (masterAdmin) {
      console.log(`✅ Master admin exists: ${masterAdmin.full_name} (${masterAdmin.email}) - Role: ${masterAdmin.role}`);
    } else {
      console.log('⚠️ Master admin user not found');
    }
    
    // Check organizations table
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (orgsError) {
      if (orgsError.message.includes('relation') && orgsError.message.includes('does not exist')) {
        console.log('❌ Organizations table does not exist');
      } else {
        console.error('❌ Error checking organizations table:', orgsError.message);
      }
    } else {
      console.log('✅ Organizations table exists');
      
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Total organizations in database: ${orgCount || 0}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

checkUsersTable().then(exists => {
  if (exists) {
    console.log('\n✅ Database is properly configured for People page');
  } else {
    console.log('\n❌ Database needs to be set up for People page');
    console.log('📝 Run the SQL script mentioned above to fix this issue');
  }
});
