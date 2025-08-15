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
    // Try with minimal columns first
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

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
      console.log(`   ${index + 1}. User:`)
      Object.keys(user).forEach(key => {
        console.log(`      ${key}: ${user[key]}`)
      })
      console.log('')
    })

    // Find user by email (look for any email that might be the master admin)
    const { data: specificUser, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single()

    if (specificError) {
      console.log('❌ Specific user 85baris@gmail.com not found:', specificError.message)
      
      // Try to find any user with "baris" in email
      const { data: barisUsers, error: barisError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', '%baris%')

      if (!barisError && barisUsers && barisUsers.length > 0) {
        console.log('🔍 Found users with "baris" in email:')
        barisUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.id})`)
        })
      }
    } else {
      console.log('✅ Found specific user 85baris@gmail.com:')
      Object.keys(specificUser).forEach(key => {
        console.log(`   ${key}: ${specificUser[key]}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUsers() 