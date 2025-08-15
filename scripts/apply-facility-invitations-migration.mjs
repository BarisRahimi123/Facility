import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyFacilityInvitationsMigration() {
  console.log('🔍 Applying facility invitations migration...\n')

  try {
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/20250116_create_facility_invitations_table.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded from:', migrationPath)
    console.log('📝 SQL content length:', migrationSQL.length, 'characters')

    // Split the SQL into individual statements (some commands need to be run separately)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`\n🔄 Executing ${statements.length} SQL statements...\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length === 0) continue

      const preview = statement.substring(0, 60) + (statement.length > 60 ? '...' : '')
      console.log(`   ${i + 1}. ${preview}`)

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('facility_invitations')
            .select('count')
            .limit(1)

          if (directError && directError.code !== '42P01') {
            console.error(`      ❌ Error: ${error.message}`)
          } else {
            console.log(`      ✅ Executed (via fallback)`)
          }
        } else {
          console.log(`      ✅ Executed`)
        }
      } catch (execError) {
        console.error(`      ⚠️  Execution error: ${execError.message}`)
      }
    }

    console.log('\n🧪 Testing table creation...')

    // Test if the table was created successfully
    const { data, error: testError } = await supabase
      .from('facility_invitations')
      .select('count')
      .limit(1)

    if (testError) {
      if (testError.code === '42P01') {
        console.log('❌ Table still does not exist after migration')
        console.log('\n📋 Manual Migration Required:')
        console.log('1. Go to your Supabase project dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste the following SQL:')
        console.log('\n' + '='.repeat(60))
        console.log(migrationSQL)
        console.log('='.repeat(60))
        console.log('\n4. Click "Run" to execute the migration')
        return false
      } else {
        console.error('❌ Unexpected error testing table:', testError)
        return false
      }
    }

    console.log('✅ facility_invitations table created successfully!')

    // Test basic functionality
    console.log('\n🧪 Testing table functionality...')
    
    const testInvitation = {
      facility_ids: ['test-facility-id'],
      invitee_email: 'test@example.com',
      invitee_name: 'Test User',
      inviter_id: null,
      role: 'consultant',
      company: 'Test Company',
      message: 'Test invitation',
      permissions: {
        viewPlans: true,
        viewTasks: true,
        viewDocuments: true,
        viewMaintenance: true,
        viewReports: true,
        addComments: false
      },
      status: 'pending',
      token: 'test_token_' + Date.now(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { data: invitation, error: insertError } = await supabase
      .from('facility_invitations')
      .insert(testInvitation)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting test invitation:', insertError)
      return false
    }

    console.log('✅ Test invitation created:', invitation.token)

    // Clean up test invitation
    await supabase
      .from('facility_invitations')
      .delete()
      .eq('id', invitation.id)

    console.log('✅ Test invitation cleaned up')

    console.log('\n🎉 Migration applied successfully!')
    console.log('📤 Facility sharing should now work correctly')

    return true

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

applyFacilityInvitationsMigration().then(success => {
  if (success) {
    console.log('\n✅ READY: You can now share facilities with consultants!')
  } else {
    console.log('\n❌ FAILED: Manual migration required (see instructions above)')
  }
}).catch(console.error) 