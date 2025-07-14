const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetMasterAdminPassword() {
  try {
    console.log('Resetting master admin password...');
    
    // Update the password for the master admin
    const { data, error } = await supabase.auth.admin.updateUserById(
      'd73d82d8-27f5-4c78-9c4b-978c272069b8',
      { password: 'password123' }
    );
    
    if (error) {
      console.error('Error resetting password:', error);
      return;
    }
    
    console.log('✅ Password reset successfully!');
    console.log('You can now login with:');
    console.log('Email: 85baris@gmail.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

resetMasterAdminPassword(); 