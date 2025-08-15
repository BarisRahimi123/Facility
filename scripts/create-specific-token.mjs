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

async function createSpecificToken() {
  const token = 'mm7espqros9orkk3k9wqj' // The token from the URL
  
  console.log('🔧 Creating contractor invitation with token:', token)
  console.log('')

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

    console.log(`✅ Using user: ${users.email}`)

    // Get an existing maintenance task or create one
    let task = null
    const { data: existingTasks, error: taskError } = await supabase
      .from('maintenance_tasks')
      .select('id, title, facility_id, organization_id')
      .eq('organization_id', users.organization_id)
      .limit(1)

    if (taskError || !existingTasks || existingTasks.length === 0) {
      console.log('📋 No existing tasks, creating a new one...')
      
      // Get a facility
      const { data: facilities, error: facilityError } = await supabase
        .from('facilities')
        .select('id, name')
        .limit(1)

      if (facilityError || !facilities || facilities.length === 0) {
        console.error('❌ No facilities found')
        return
      }

      // Create a new task
      const taskData = {
        facility_id: facilities[0].id,
        organization_id: users.organization_id,
        title: 'Plumbing Issue - Kitchen Faucet Leak',
        description: 'Kitchen faucet in the main cafeteria is leaking continuously. Water pressure seems normal but the drip is constant and wasting water.',
        type: 'corrective',
        priority: 'medium',
        status: 'new',
        location: 'Main Cafeteria - Kitchen Area',
        system_type: 'Plumbing',
        issue_type: 'Leak',
        impact: 'medium',
        severity: 'low',
        assignment_type: 'external',
        submitter_name: 'Maintenance Coordinator',
        submitter_email: '85baris@gmail.com',
        submitter_phone: '+1-555-0123',
        notes: 'Please assess and provide repair quote. Access available during business hours.',
        created_by: users.id
      }

      const { data: newTask, error: createTaskError } = await supabase
        .from('maintenance_tasks')
        .insert(taskData)
        .select()
        .single()

      if (createTaskError) {
        console.error('❌ Failed to create task:', createTaskError)
        return
      }

      task = newTask
      console.log(`✅ Created new task: ${task.title}`)
    } else {
      task = existingTasks[0]
      console.log(`✅ Using existing task: ${task.title}`)
    }

    // Create contractor invitation with the specific token
    const invitationData = {
      task_id: task.id,
      email: 'plumber@contractorservices.com',
      phone: '+1-555-0234',
      company_name: 'Elite Plumbing Solutions',
      role: 'contractor',
      token: token,
      status: 'pending',
      invited_by: users.id,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      notes: 'Please assess the plumbing leak and provide repair estimate with timeline'
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

    console.log(`✅ Created contractor invitation:`)
    console.log(`   Email: ${invitation.email}`)
    console.log(`   Company: ${invitation.company_name}`)
    console.log(`   Token: ${invitation.token}`)
    console.log(`   Expires: ${invitation.expires_at}`)

    console.log('\n🎉 Token created successfully!')
    console.log(`\n🌐 The shareable form should now work at:`)
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
    console.error('❌ Error creating token:', error)
  }
}

createSpecificToken() 