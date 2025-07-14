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

async function checkUser() {
  try {
    console.log('Checking user 85baris@gmail.com...\n');
    
    // Check if user exists in users table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();
    
    if (error) {
      console.log('Error finding user in users table:', error.message);
      console.log('\nTrying to find by auth.users...');
      
      // Check if user exists in auth.users
      const { data: authData } = await supabase.auth.admin.listUsers();
      if (authData) {
        const authUser = authData.users.find(u => u.email === '85baris@gmail.com');
        if (authUser) {
          console.log('\nFound in auth.users:');
          console.log('- Auth ID:', authUser.id);
          console.log('- Email:', authUser.email);
          console.log('- Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
          console.log('- Created at:', new Date(authUser.created_at).toLocaleString());
          
          // Check if this user ID exists in users table
          const { data: userById } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();
            
          if (userById) {
            console.log('\nFound in users table by ID:');
            console.log('- Email in DB:', userById.email);
            console.log('- Role:', userById.role);
            console.log('- Is Active:', userById.is_active);
          } else {
            console.log('\nUser exists in auth but NOT in users table!');
            console.log('This user needs to be added to the users table.');
          }
        } else {
          console.log('\nUser not found in auth.users either.');
          console.log('The user may not have signed up yet.');
        }
      }
      return;
    }
    
    console.log('User found in users table:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Is Active:', user.is_active);
    console.log('- Full Name:', user.full_name);
    console.log('- Organization ID:', user.organization_id);
    
    // Check role capabilities
    console.log('\nRole Analysis:');
    if (user.role === 'master_admin') {
      console.log('✓ User is a MASTER ADMIN - should have full access');
      console.log('✓ Can access People page');
      console.log('✓ Can see Master Users tab');
      console.log('✓ Can invite Sub-Master Admins');
    } else if (user.role === 'sub_admin') {
      console.log('✓ User is a SUB-MASTER ADMIN');
      console.log('✓ Can access People page');
      console.log('✗ Cannot see Master Users tab');
      console.log('✓ Can invite Staff members only');
    } else if (user.role === 'staff') {
      console.log('✗ User is STAFF');
      console.log('✗ Cannot access People page');
      console.log('✗ Cannot see Master Users tab');
      console.log('✗ Cannot invite anyone');
    } else {
      console.log('⚠️  User has legacy role:', user.role);
      console.log('This role needs to be migrated to the three-tier system');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkUser(); 