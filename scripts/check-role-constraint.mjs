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

async function checkRoleConstraint() {
  console.log('🔍 Checking role constraints in task_contractor_invitations table...\n')

  try {
    // First, let's see if there are any existing records to understand the valid roles
    const { data: existingInvitations, error: existingError } = await supabase
      .from('task_contractor_invitations')
      .select('role')
      .limit(10)

    if (!existingError && existingInvitations && existingInvitations.length > 0) {
      console.log('📋 Existing roles in database:')
      const uniqueRoles = [...new Set(existingInvitations.map(inv => inv.role))]
      uniqueRoles.forEach(role => {
        console.log(`   - ${role}`)
      })
    } else {
      console.log('📋 No existing invitations found, checking constraint...')
    }

    // Try different valid roles based on the error message pattern
    const rolesToTest = ['contractor', 'vendor', 'consultant']
    
    console.log('\n🧪 Testing valid roles:')
    
    for (const role of rolesToTest) {
      try {
        const testData = {
          email: 'test@example.com',
          role: role,
          token: `test-${role}-${Date.now()}`,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }

        const { data, error } = await supabase
          .from('task_contractor_invitations')
          .insert(testData)
          .select()

        if (error) {
          console.log(`   ❌ ${role}: ${error.message}`)
        } else {
          console.log(`   ✅ ${role}: Valid role`)
          
          // Clean up the test record
          await supabase
            .from('task_contractor_invitations')
            .delete()
            .eq('id', data[0].id)
        }
      } catch (err) {
        console.log(`   ❌ ${role}: ${err.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkRoleConstraint() 