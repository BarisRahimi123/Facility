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

async function checkUsers() {
  console.log('👥 Checking users in database...\n')

  try {
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, user_role, organization_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (userError) {
      console.error('❌ Error fetching users:', userError)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in database')
      return
    }

    console.log('📋 Users found:')
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email}`)
      console.log(`      ID: ${user.id}`)
      console.log(`      Role: ${user.user_role || 'undefined'}`)
      console.log(`      Org ID: ${user.organization_id || 'undefined'}`)
      console.log(`      Created: ${user.created_at}`)
      console.log('')
    })

    // Check organizations too
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .limit(5)

    if (!orgError && orgs && orgs.length > 0) {
      console.log('🏢 Organizations found:')
      orgs.forEach(org => {
        console.log(`   - ${org.name} (${org.id})`)
      })
    } else {
      console.log('❌ No organizations found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUsers() 