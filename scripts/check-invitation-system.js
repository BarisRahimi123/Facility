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

async function checkInvitationSystem() {
  try {
    console.log('Checking invitation system setup...\n');
    
    // 1. Check if user_invitations table exists
    const { data: tables } = await supabase
      .from('user_invitations')
      .select('*')
      .limit(1);
    
    if (tables === null) {
      console.log('❌ user_invitations table does NOT exist');
      console.log('   The invitation system needs to be set up.\n');
    } else {
      console.log('✓ user_invitations table exists');
    }
    
    // 2. Try to call the send_user_invitation function
    const { data, error } = await supabase.rpc('send_user_invitation', {
      p_email: 'test@example.com',
      p_role: 'staff',
      p_invited_by: 'd73d82d8-27f5-4c78-9c4b-978c272069b8', // Your user ID
      p_facility_id: null,
      p_organization_id: null,
      p_metadata: { test: true }
    });
    
    if (error) {
      if (error.message?.includes('function') && error.message?.includes('does not exist')) {
        console.log('❌ send_user_invitation function does NOT exist');
        console.log('   The function needs to be created in the database.\n');
      } else if (error.message?.includes('already exists')) {
        console.log('⚠️  Test invitation already exists (this is okay)');
        console.log('✓ send_user_invitation function exists and works\n');
      } else {
        console.log('⚠️  Function exists but returned error:', error.message);
      }
    } else {
      console.log('✓ send_user_invitation function exists and works');
      console.log('   Created test invitation:', data);
      
      // Clean up test invitation
      if (data?.id) {
        await supabase
          .from('user_invitations')
          .delete()
          .eq('id', data.id);
        console.log('   Cleaned up test invitation\n');
      }
    }
    
    // 3. Check if can_invite_user function exists
    const { error: canInviteError } = await supabase.rpc('can_invite_user', {
      inviter_role: 'master_admin',
      invitee_role: 'sub_admin'
    });
    
    if (canInviteError && canInviteError.message?.includes('does not exist')) {
      console.log('❌ can_invite_user function does NOT exist');
    } else {
      console.log('✓ can_invite_user function exists');
    }
    
    console.log('\n📋 Summary:');
    console.log('If any items above show ❌, you need to apply the invitation system migration.');
    console.log('Migration file: supabase/migrations/20250129_authentication_hierarchy_fixed.sql');
    console.log('\nTo apply it:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and paste the migration file contents');
    console.log('3. Run the SQL');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkInvitationSystem(); 