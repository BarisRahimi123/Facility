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
    // Use raw SQL query instead of Supabase client methods
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT table_name, table_type 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      })

    if (error) {
      // Try alternative approach
      console.log('Trying alternative approach...')
      
      // Test with a simple query to see if basic tables exist
      const testTables = ['users', 'facilities', 'buildings', 'rooms', 'organizations', 'maintenance_tasks']
      
      for (const tableName of testTables) {
        try {
          const { data, error: testError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          if (testError) {
            if (testError.code === '42P01') {
              console.log(`   ❌ ${tableName} - DOES NOT EXIST`)
            } else {
              console.log(`   ⚠️  ${tableName} - EXISTS but error: ${testError.message}`)
            }
          } else {
            console.log(`   ✅ ${tableName} - EXISTS`)
          }
        } catch (err) {
          console.log(`   ❌ ${tableName} - ERROR: ${err.message}`)
        }
      }
      return
    }

    if (!tables || tables.length === 0) {
      console.log('❌ No tables found')
      return
    }

    console.log('📋 Tables in database:', tables)

  } catch (err) {
    console.error('❌ Error:', err.message)
    
    // Final fallback - try to query Supabase auth tables which should always exist
    try {
      console.log('\n🔍 Testing basic connection...')
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.log('❌ Auth connection failed:', error.message)
      } else {
        console.log('✅ Basic Supabase connection working')
        console.log('💡 This suggests your main application tables need to be created')
      }
    } catch (authErr) {
      console.log('❌ Complete connection failure:', authErr.message)
    }
  }
}

checkExistingTables() 