import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndUpdateMasterAdmin() {
  try {
    console.log('Checking master admin user role...');
    
    // Check current role
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', '85baris@gmail.com')
      .single();
    
    if (fetchError) {
      console.error('Error fetching user:', fetchError);
      return;
    }
    
    console.log('Current user data:', currentUser);
    
    // Update to master_admin if needed
    if (currentUser.role !== 'master_admin') {
      console.log(`Updating role from ${currentUser.role} to master_admin...`);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ role: 'master_admin' })
        .eq('email', '85baris@gmail.com')
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating role:', updateError);
        return;
      }
      
      console.log('✅ Successfully updated user role to master_admin');
      console.log('Updated user:', updatedUser);
    } else {
      console.log('✅ User already has master_admin role');
    }
    
    // Also check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (!authError) {
      const user = authUser.users.find(u => u.email === '85baris@gmail.com');
      if (user) {
        console.log('✅ User exists in auth system with ID:', user.id);
      } else {
        console.log('⚠️ User not found in auth system');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndUpdateMasterAdmin(); 