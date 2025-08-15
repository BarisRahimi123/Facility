import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkFacilitySharing() {
  console.log('🔍 Checking facility sharing functionality...\n')

  try {
    // Check if facility_invitations table exists
    const { data: invitation, error: testError } = await supabase
      .from('facility_invitations')
      .select('count')
      .limit(1)

    if (testError && testError.code === '42P01') {
      console.log('❌ facility_invitations table does not exist!')
      console.log('   Need to create the table first')
      console.log('   Migration file: supabase/migrations/20250116_create_facility_invitations_table.sql')
      return { tableExists: false }
    }

    if (testError) {
      console.error('❌ Error accessing facility_invitations table:', testError)
      return { tableExists: false, error: testError }
    }

    console.log('✅ facility_invitations table exists')

    // Check for Grandville Hall facility
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, status')
      .ilike('name', '%grandville%')

    if (facilityError) {
      console.error('❌ Error fetching Grandville facility:', facilityError)
      return { tableExists: true, facilityFound: false, error: facilityError }
    }

    if (!facilities || facilities.length === 0) {
      console.log('❌ No Grandville Hall facility found')
      console.log('   Searching for similar facilities...')
      
      const { data: allFacilities } = await supabase
        .from('facilities')
        .select('name, status')
        .order('name')
      
      console.log('   Available facilities:')
      allFacilities?.forEach(f => console.log(`   - ${f.name} (${f.status})`))
      return { tableExists: true, facilityFound: false }
    }

    const grandville = facilities[0]
    console.log(`✅ Found facility: ${grandville.name} (ID: ${grandville.id})`)

    // Test facility invitation creation
    console.log('\n🧪 Testing facility invitation creation...')

    const testToken = 'test_token_' + Date.now()
    const testInvitation = {
      facility_ids: [grandville.id],
      invitee_email: 'test.consultant@example.com',
      invitee_name: 'Test Consultant',
      inviter_id: null,
      role: 'consultant',
      company: 'Test Consulting Inc.',
      message: 'Test invitation for Grandville Hall',
      permissions: {
        viewPlans: true,
        viewTasks: true,
        viewDocuments: true,
        viewMaintenance: true,
        viewReports: true,
        addComments: false
      },
      status: 'pending',
      token: testToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { data: newInvitation, error: invitationError } = await supabase
      .from('facility_invitations')
      .insert(testInvitation)
      .select()
      .single()

    if (invitationError) {
      console.error('❌ Failed to create test invitation:', invitationError)
      console.log('   Error details:', invitationError.message)
      console.log('   Error code:', invitationError.code)
      
      if (invitationError.code === '23503') {
        console.log('   This is a foreign key constraint error')
        console.log('   Checking user references...')
      }
      
      return { tableExists: true, facilityFound: true, invitationWorking: false, error: invitationError }
    }

    console.log('✅ Test invitation created successfully')
    console.log(`   Token: ${newInvitation.token}`)
    console.log(`   Invitee: ${newInvitation.invitee_email}`)
    console.log(`   Facility IDs: ${JSON.stringify(newInvitation.facility_ids)}`)

    // Clean up test invitation
    const { error: deleteError } = await supabase
      .from('facility_invitations')
      .delete()
      .eq('id', newInvitation.id)

    if (deleteError) {
      console.warn('⚠️  Could not clean up test invitation:', deleteError)
    } else {
      console.log('✅ Test invitation cleaned up')
    }

    console.log('\n🎉 Facility sharing functionality is working correctly!')
    return { 
      tableExists: true, 
      facilityFound: true, 
      invitationWorking: true,
      facilityData: grandville
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return { error }
  }
}

checkFacilitySharing().then(result => {
  console.log('\n📊 Summary:')
  console.log(`   Table exists: ${result.tableExists || false}`)
  console.log(`   Facility found: ${result.facilityFound || false}`)
  console.log(`   Invitation working: ${result.invitationWorking || false}`)
  
  if (result.error) {
    console.log(`   Error: ${result.error.message}`)
  }
  
  if (!result.tableExists) {
    console.log('\n🔧 Next steps:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Run the migration: supabase/migrations/20250116_create_facility_invitations_table.sql')
  }
  
  if (result.tableExists && !result.facilityFound) {
    console.log('\n🔧 Next steps:')
    console.log('   1. Check the exact name of the facility you\'re trying to share')
    console.log('   2. Verify the facility exists and is active')
  }
}).catch(console.error) 