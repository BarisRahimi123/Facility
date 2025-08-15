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

async function checkSpecificToken() {
  const token = 'mm7espqros9orkk3k9wqj' // The token from the URL
  
  console.log('🔍 Checking token:', token)
  console.log('')

  try {
    // Check if the token exists
    const { data: invitation, error: invitationError } = await supabase
      .from('task_contractor_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError) {
      console.error('❌ Error or token not found:', invitationError.message)
      
      // Show all existing tokens
      const { data: allInvitations, error: allError } = await supabase
        .from('task_contractor_invitations')
        .select('id, token, email, status, expires_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (!allError && allInvitations && allInvitations.length > 0) {
        console.log('\n📋 Available tokens in database:')
        allInvitations.forEach(inv => {
          const isExpired = new Date(inv.expires_at) < new Date()
          console.log(`  - ${inv.token} | ${inv.email} | ${inv.status} | ${isExpired ? 'EXPIRED' : 'Valid'}`)
        })
      }
      
      return false
    }

    console.log('✅ Token found!')
    console.log('  Email:', invitation.email)
    console.log('  Status:', invitation.status)
    console.log('  Expires:', invitation.expires_at)
    
    const isExpired = new Date(invitation.expires_at) < new Date()
    if (isExpired) {
      console.log('⚠️  Token is EXPIRED')
    } else {
      console.log('✅ Token is valid')
    }
    
    return true

  } catch (error) {
    console.error('❌ Error:', error)
    return false
  }
}

checkSpecificToken().then(exists => {
  if (!exists) {
    console.log('\n💡 To create this token, we need to:')
    console.log('   1. Create or use an existing maintenance task')
    console.log('   2. Create a contractor invitation with this specific token')
  }
}) 