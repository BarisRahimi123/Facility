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

async function createTestMaintenanceTask() {
  console.log('🔧 Creating test maintenance task with contractor invitation...\n')

  try {
    // First, get a facility and organization
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name, organization_id')
      .limit(1)

    if (facilityError || !facilities || facilities.length === 0) {
      console.error('❌ No facilities found. Need to create a facility first.')
      return
    }

    const facility = facilities[0]
    console.log(`✅ Using facility: ${facility.name} (${facility.id})`)

    // Get master admin user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, user_role')
      .eq('email', '85baris@gmail.com')
      .single()

    if (userError || !users) {
      console.error('❌ Master admin user not found')
      return
    }

    console.log(`✅ Using user: ${users.email} (${users.user_role})`)

    // Create a maintenance task
    const taskData = {
      facility_id: facility.id,
      organization_id: facility.organization_id,
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
      created_by: users.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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

    // Generate a simple token (since we don't have gen_random_bytes)
    const token = 'ppzryyx5oqgbj47hg4n3c' // Use the token from the URL

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
      invited_at: new Date().toISOString(),
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
    console.log(`\n🌐 Test the shareable form at:`)
    console.log(`   http://localhost:3000/maintenance/report/${token}`)

    // Log activity
    await supabase
      .from('task_activity_log')
      .insert({
        task_id: task.id,
        user_id: users.id,
        action: 'contractor_invitation_sent',
        details: {
          contractor_email: invitation.email,
          company: invitation.company_name,
          token: invitation.token
        }
      })

    console.log(`✅ Activity logged`)

  } catch (error) {
    console.error('❌ Error creating test data:', error)
  }
}

createTestMaintenanceTask() 