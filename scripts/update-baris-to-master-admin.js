const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function updateUserRole() {
  try {
    console.log('Updating 85baris@gmail.com to master_admin role...\n');
    
    // Update the user's role
    const { data, error } = await supabase
      .from('users')
      .update({ 
        role: 'master_admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', '85baris@gmail.com')
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user role:', error);
      return;
    }
    
    console.log('✓ Successfully updated user role!');
    console.log('Updated user:');
    console.log('- Email:', data.email);
    console.log('- New Role:', data.role);
    console.log('- Full Name:', data.full_name);
    console.log('\nThe user can now:');
    console.log('✓ Access the People page');
    console.log('✓ See the Master Users tab');
    console.log('✓ Invite Sub-Master Admins');
    console.log('✓ Have full platform access');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

updateUserRole(); 