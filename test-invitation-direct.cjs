require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testInvitation() {
  console.log('🧪 Testing invitation system directly...');
  
  try {
    const testEmail = `test-invitation-${Date.now()}@example.com`;
    
    console.log('📧 Sending invitation to:', testEmail);
    
    const { data, error } = await supabase.rpc('send_user_invitation', {
      p_email: testEmail,
      p_role: 'sub_admin',
      p_invited_by: 'd73d82d8-27f5-4c78-9c4b-978c272069b8', // Your master admin user ID
      p_facility_id: null,
      p_organization_id: null,
      p_metadata: {
        fullName: 'Test Sub Master',
        phone: '(555) 123-4567',
        company_name: 'Test Company',
        company_address: '123 Test St',
        company_city: 'Test City',
        company_state: 'CA',
        company_zip: '12345'
      }
    });

    if (error) {
      console.error('❌ Invitation failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Invitation successful!');
      console.log('Response data:', data);
      console.log('\n📋 Invitation details:');
      console.log('- Email:', data.email);
      console.log('- Role:', data.role);
      console.log('- Token:', data.token?.substring(0, 20) + '...');
      console.log('- Invitation URL:', data.invitation_url);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

testInvitation();
