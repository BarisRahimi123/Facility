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

async function checkFacilitiesColumns() {
  console.log('🔍 Checking facilities table structure...\n')

  try {
    // Get any existing facility to see its structure
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error fetching facilities:', error)
      return
    }

    if (!facilities || facilities.length === 0) {
      console.log('❌ No facilities found')
      return
    }

    console.log('📋 Facilities table columns:')
    Object.keys(facilities[0]).forEach(column => {
      console.log(`   - ${column}: ${typeof facilities[0][column]} = ${facilities[0][column]}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkFacilitiesColumns() 