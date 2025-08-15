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

async function createWorkingTestData() {
  console.log('🔧 Creating working test data...\n')

  try {
    // Get master admin user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role, organization_id')
      .eq('email', '85baris@gmail.com')
      .single()

    if (userError || !users) {
      console.error('❌ Master admin user not found')
      return
    }

    console.log(`✅ Using user: ${users.email} (${users.role})`)

    // Check existing facilities - use any facility since there's no organization_id in facilities
    const { data: existingFacilities, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .limit(1)

    let facility = null

    if (facilityError || !existingFacilities || existingFacilities.length === 0) {
      console.log('📋 No facilities found, creating test facility...')
      
      // Create facility with actual columns
      const facilityData = {
        name: 'Test Maintenance Facility',
        facility_type: 'Office',
        address: '123 Test Street, Test City, CA 90210',
        status: 'active',
        square_footage: 5000,
        facility_condition_index: 85,
        description: 'Test facility for maintenance system',
        rooms: 10,
        year_built: 2020,
        created_by: users.id
      }

      const { data: newFacility, error: createFacilityError } = await supabase
        .from('facilities')
        .insert(facilityData)
        .select()
        .single()

      if (createFacilityError) {
        console.error('❌ Failed to create facility:', createFacilityError)
        return
      }

      facility = newFacility
      console.log(`✅ Created facility: ${facility.name} (${facility.id})`)
    } else {
      facility = existingFacilities[0]
      console.log(`✅ Using existing facility: ${facility.name} (${facility.id})`)
    }

    // Check if token already exists
    const token = 'ppzryyx5oqgbj47hg4n3c'
    const { data: existingInvitation, error: existingError } = await supabase
      .from('task_contractor_invitations')
      .select('id, token, task_id')
      .eq('token', token)
      .single()

    if (existingInvitation) {
      console.log(`✅ Token ${token} already exists!`)
      console.log(`\n🌐 The shareable form should now work at:`)
      console.log(`   http://localhost:3000/maintenance/report/${token}`)
      return
    }

    // Create maintenance task - use organization_id from user since it's not in facilities
    const taskData = {
      facility_id: facility.id,
      organization_id: users.organization_id, // Use user's organization
      title: 'Test HVAC Repair - External Contractor Needed',
      description: 'Air conditioning unit in the main lobby is not cooling properly. Temperature readings show 85°F when set to 72°F. Need professional assessment and repair.',
      type: 'corrective',
      priority: 'high',
      status: 'new',
      location: 'Main Lobby - HVAC Unit #1',
      system_type: 'HVAC',
      issue_type: 'Cooling Issue',
      impact: 'high',
      severity: 'medium',
      assignment_type: 'external',
      submitter_name: 'Facility Manager',
      submitter_email: '85baris@gmail.com',
      submitter_phone: '+1-555-0123',
      notes: 'High priority due to upcoming client meetings in lobby area.',
      created_by: users.id
    }

    const { data: task, error: taskError } = await supabase
      .from('maintenance_tasks')
      .insert(taskData)
      .select()
      .single()

    if (taskError) {
      console.error('❌ Failed to create maintenance task:', taskError)
      return
    }

    console.log(`✅ Created maintenance task: ${task.title} (${task.id})`)

    // Create contractor invitation
    const invitationData = {
      task_id: task.id,
      email: 'contractor@example.com',
      phone: '+1-555-0199',
      company_name: 'ProHVAC Services LLC',
      role: 'contractor',
      token: token,
      status: 'pending',
      invited_by: users.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      notes: 'Please assess the HVAC issue and provide repair estimate'
    }

    const { data: invitation, error: invitationError } = await supabase
      .from('task_contractor_invitations')
      .insert(invitationData)
      .select()
      .single()

    if (invitationError) {
      console.error('❌ Failed to create contractor invitation:', invitationError)
      return
    }

    console.log(`✅ Created contractor invitation: ${invitation.email}`)
    console.log(`🔗 Token: ${invitation.token}`)
    console.log(`📅 Expires: ${invitation.expires_at}`)

    console.log('\n🎉 Test data created successfully!')
    console.log(`\n🌐 The shareable form should now work at:`)
    console.log(`   http://localhost:3000/maintenance/report/${token}`)

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  }
}

createWorkingTestData() 