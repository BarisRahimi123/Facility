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

async function checkExistingTables() {
  console.log('🔍 Checking what tables exist in the database...\n')

  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')

    if (error) {
      console.error('❌ Error querying tables:', error)
      return
    }

    if (!tables || tables.length === 0) {
      console.log('❌ No tables found in public schema')
      return
    }

    console.log('📋 Tables in public schema:')
    tables.forEach(table => {
      console.log(`   ${table.table_name} (${table.table_type})`)
    })

    console.log(`\n✅ Total: ${tables.length} tables found`)

    // Check if any of our expected core tables exist
    const coreTablesFound = tables.filter(t => 
      ['users', 'facilities', 'buildings', 'rooms', 'organizations'].includes(t.table_name)
    )

    if (coreTablesFound.length > 0) {
      console.log('\n🎯 Core application tables found:')
      coreTablesFound.forEach(table => {
        console.log(`   ✅ ${table.table_name}`)
      })
    } else {
      console.log('\n⚠️  No core application tables found. Need to run base migrations first.')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

checkExistingTables() 