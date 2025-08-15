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

async function checkMaintenanceTables() {
  console.log('🔍 Checking maintenance system tables...\n')

  // Check if organizations table exists (referenced by maintenance_tasks)
  console.log('1. Checking for required dependency tables:')
  
  const dependencyTables = [
    'organizations',
    'facilities', 
    'buildings',
    'rooms',
    'users'
  ]

  for (const tableName of dependencyTables) {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single()

    if (error || !data) {
      console.log(`   ❌ ${tableName} - MISSING`)
    } else {
      console.log(`   ✅ ${tableName} - EXISTS`)
    }
  }

  console.log('\n2. Checking for maintenance system tables:')
  
  const maintenanceTables = [
    'maintenance_tasks',
    'task_assignments',
    'task_contractor_invitations',
    'task_attachments',
    'task_comments',
    'task_activity_log',
    'vendors',
    'request_for_quotes',
    'rfq_vendor_invitations'
  ]

  for (const tableName of maintenanceTables) {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .single()

    if (error || !data) {
      console.log(`   ❌ ${tableName} - MISSING`)
    } else {
      console.log(`   ✅ ${tableName} - EXISTS`)
    }
  }

  // Check if gen_random_uuid function exists
  console.log('\n3. Checking for required functions:')
  
  const { data: uuidFunc, error: uuidError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_schema', 'public')
    .eq('routine_name', 'gen_random_uuid')
    .single()

  if (uuidError || !uuidFunc) {
    console.log('   ❌ gen_random_uuid - MISSING (need to enable pgcrypto extension)')
  } else {
    console.log('   ✅ gen_random_uuid - EXISTS')
  }

  // Check if extensions are enabled
  console.log('\n4. Checking extensions:')
  
  const { data: extensions, error: extError } = await supabase
    .from('pg_extension')
    .select('extname')
    .in('extname', ['pgcrypto', 'uuid-ossp'])

  if (extError) {
    console.log('   ❌ Could not check extensions')
  } else {
    console.log('   Extensions found:', extensions.map(e => e.extname).join(', ') || 'none')
  }

  console.log('\n5. Sample query test:')
  
  try {
    const { data, error } = await supabase
      .rpc('version')

    if (error) {
      console.log('   ❌ Basic RPC test failed:', error.message)
    } else {
      console.log('   ✅ Database connection working')
    }
  } catch (err) {
    console.log('   ❌ Connection test failed:', err.message)
  }
}

checkMaintenanceTables() 