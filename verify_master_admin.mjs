import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_EMAIL = '85baris@gmail.com';
const DESIRED_ROLE = 'master_admin';
const NEW_PASSWORD = 'password123';

async function verifyMasterAdmin() {
  console.log(`Verifying master admin: ${USER_EMAIL}`);

  // Step 1: Find user in auth.users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  const authUser = users.find(u => u.email === USER_EMAIL);

  if (!authUser) {
    console.error(`User ${USER_EMAIL} not found in Supabase Auth.`);
    return;
  }

  console.log(`Found user in Auth: ${authUser.id}`);

  // Step 2: Update password
  const { error: passwordError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    { password: NEW_PASSWORD }
  );

  if (passwordError) {
    console.error(`Error updating password: ${passwordError.message}`);
  } else {
    console.log(`Password updated successfully for ${USER_EMAIL}.`);
  }

  // Step 3: Find user in public.users table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !userProfile) {
    console.error(`User not found in public.users table with matching ID. Attempting to find by email...`);
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', USER_EMAIL)
      .single();

    if (emailError || !userByEmail) {
        console.error(`User not found by email either. This needs manual correction.`);
        return;
    }
    
    console.log(`Found user by email. Updating ID to match Auth user ID.`);
    const { error: idUpdateError } = await supabase
      .from('users')
      .update({ id: authUser.id, role: DESIRED_ROLE })
      .eq('email', USER_EMAIL);

    if (idUpdateError) {
        console.error(`Failed to update user ID and role: ${idUpdateError.message}`);
    } else {
        console.log(`User ID and role updated successfully.`);
    }
    
  } else {
    // User found by ID, just check and update role
    if (userProfile.role !== DESIRED_ROLE) {
      console.log(`Updating role from '${userProfile.role}' to '${DESIRED_ROLE}'...`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: DESIRED_ROLE })
        .eq('id', authUser.id);
      if (updateError) {
        console.error(`Error updating role: ${updateError.message}`);
      } else {
        console.log('Role updated successfully.');
      }
    } else {
      console.log('User already has master_admin role.');
    }
  }

  console.log('Verification complete.');
}

verifyMasterAdmin();
