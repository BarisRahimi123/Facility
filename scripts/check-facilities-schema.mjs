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

async function checkFacilitiesSchema() {
  console.log('🔍 Checking facilities table schema...\n')

  try {
    // Get a sample facility to see the actual columns
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('*')
      .limit(1)

    if (facilitiesError) {
      console.error('❌ Error fetching facilities:', facilitiesError)
      return
    }

    if (!facilities || facilities.length === 0) {
      console.log('❌ No facilities found in database')
      return
    }

    const facility = facilities[0]
    console.log('📋 Actual facilities table columns:')
    Object.keys(facility).forEach(column => {
      console.log(`   - ${column}: ${typeof facility[column]} = ${facility[column]}`)
    })

    // Also get all facilities to see what we have
    const { data: allFacilities, error: allError } = await supabase
      .from('facilities')
      .select('*')

    if (!allError && allFacilities) {
      console.log(`\n📊 Total facilities in database: ${allFacilities.length}`)
      allFacilities.forEach((fac, index) => {
        console.log(`   ${index + 1}. ${fac.name} (${fac.id})`)
        console.log(`      Status: ${fac.status}`)
        console.log(`      Created by: ${fac.created_by}`)
        if (fac.organization_id) {
          console.log(`      Organization: ${fac.organization_id}`)
        }
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkFacilitiesSchema() 