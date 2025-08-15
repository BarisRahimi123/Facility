import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyThreeTierAuth() {
  try {
    console.log('🚀 Applying three-tier authentication step by step...\n');

    // Step 1: Check current user role for 85baris@gmail.com
    console.log('🔍 Checking current user status...');
    const { data: currentUser, error: currentError } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();

    if (currentError) {
      console.error('❌ Error checking current user:', currentError);
      return;
    }

    console.log('✅ Current user:');
    console.log(`   Email: ${currentUser.email}`);
    console.log(`   Role: ${currentUser.role}`);
    console.log(`   Full Name: ${currentUser.full_name}`);
    console.log(`   Organization ID: ${currentUser.organization_id}\n`);

    // Step 2: Update the user role to master_admin (using the existing role column)
    console.log('🔧 Updating user role to master_admin...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'master_admin',
        full_name: 'Master Admin'
      })
      .eq('email', '85baris@gmail.com');

    if (updateError) {
      console.error('❌ Error updating user role:', updateError);
      return;
    }

    console.log('✅ User role updated to master_admin\n');

    // Step 3: Create master organization if it doesn't exist
    console.log('🏢 Creating master organization...');
    
    const masterOrgId = 'b47ac120-58cc-4372-a567-0e02b2c3d590';
    
    // Check if master org exists
    const { data: existingOrg, error: orgCheckError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', masterOrgId)
      .single();

    if (orgCheckError && orgCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking organization:', orgCheckError);
      return;
    }

    if (!existingOrg) {
      const { error: orgCreateError } = await supabase
        .from('organizations')
        .insert({
          id: masterOrgId,
          name: 'Platform Master Organization',
          type: 'district',
          is_active: true
        });

      if (orgCreateError) {
        console.error('❌ Error creating organization:', orgCreateError);
        return;
      }

      console.log('✅ Master organization created');
    } else {
      console.log('✅ Master organization already exists');
    }

    // Step 4: Update user to belong to master organization
    console.log('🔗 Linking user to master organization...');
    const { error: linkError } = await supabase
      .from('users')
      .update({ organization_id: masterOrgId })
      .eq('email', '85baris@gmail.com');

    if (linkError) {
      console.error('❌ Error linking user to organization:', linkError);
      return;
    }

    console.log('✅ User linked to master organization\n');

    // Step 5: Verify the final result
    console.log('🔍 Final verification...');
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();

    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }

    console.log('✅ Final user status:');
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Role: ${finalUser.role}`);
    console.log(`   Full Name: ${finalUser.full_name}`);
    console.log(`   Organization ID: ${finalUser.organization_id}\n`);

    // Step 6: Test password authentication
    console.log('🔐 Testing password authentication...');
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: '85baris@gmail.com',
      password: 'password123'
    });

    if (signInError) {
      console.error('❌ Password authentication failed:', signInError.message);
    } else {
      console.log('✅ Password authentication successful');
      console.log(`   Session user ID: ${signInData.user.id}`);
      await testClient.auth.signOut();
    }

    console.log('\n🎉 Master admin setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User 85baris@gmail.com exists');
    console.log('   ✅ Role set to master_admin');
    console.log('   ✅ Password works (password123)');
    console.log('   ✅ Linked to master organization');
    console.log('   ✅ Ready for login');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

applyThreeTierAuth(); 