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

async function verifyToken() {
  const token = 'ppzryyx5oqgbj47hg4n3c'
  
  console.log('🔍 Verifying maintenance token:', token)
  console.log('')

  try {
    // Check if the token exists
    const { data: invitation, error: invitationError } = await supabase
      .from('task_contractor_invitations')
      .select(`
        *,
        task:maintenance_tasks (
          id,
          title,
          description,
          type,
          priority,
          status,
          location,
          facility:facilities (
            id,
            name,
            address
          )
        )
      `)
      .eq('token', token)
      .single()

    if (invitationError) {
      console.error('❌ Error fetching invitation:', invitationError)
      return
    }

    if (!invitation) {
      console.log('❌ No invitation found with this token')
      return
    }

    console.log('✅ Invitation found!')
    console.log('  Email:', invitation.email)
    console.log('  Company:', invitation.company_name)
    console.log('  Status:', invitation.status)
    console.log('  Expires at:', invitation.expires_at)
    console.log('')
    console.log('✅ Task details:')
    console.log('  Title:', invitation.task.title)
    console.log('  Priority:', invitation.task.priority)
    console.log('  Facility:', invitation.task.facility?.name || 'No facility linked')
    console.log('')

    // Check if it's valid
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    
    if (invitation.status !== 'pending') {
      console.log('⚠️  Invitation status is not pending:', invitation.status)
    } else if (expiresAt < now) {
      console.log('⚠️  Invitation has expired')
    } else {
      console.log('✅ Invitation is valid and ready to use!')
      console.log('')
      console.log('🌐 Shareable form URL:')
      console.log(`   http://localhost:3000/maintenance/report/${token}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

verifyToken() 