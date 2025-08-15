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

async function checkAndFixFacilities() {
  console.log('🔍 Checking facilities for master admin...\n')

  try {
    // Get master admin user
    const { data: masterUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, organization_id')
      .eq('email', '85baris@gmail.com')
      .single()

    if (userError || !masterUser) {
      console.error('❌ Master admin user not found')
      return
    }

    console.log(`✅ Master admin found: ${masterUser.email}`)
    console.log(`   Role: ${masterUser.role}`)
    console.log(`   Organization ID: ${masterUser.organization_id}`)

    // Check all facilities in the system
    const { data: allFacilities, error: allFacilitiesError } = await supabase
      .from('facilities')
      .select('id, name, status, organization_id, created_by')
      .order('created_at', { ascending: false })

    if (allFacilitiesError) {
      console.error('❌ Error fetching facilities:', allFacilitiesError)
      return
    }

    console.log(`\n📋 All facilities in system (${allFacilities.length} total):`)
    allFacilities.forEach((facility, index) => {
      const isOwn = facility.organization_id === masterUser.organization_id
      const status = facility.status === 'active' ? '✅' : '❌'
      console.log(`   ${index + 1}. ${facility.name} ${status}`)
      console.log(`      Organization: ${facility.organization_id} ${isOwn ? '(YOURS)' : ''}`)
      console.log(`      Status: ${facility.status}`)
      console.log('')
    })

    // Check facilities for master admin's organization
    const { data: ownFacilities, error: ownFacilitiesError } = await supabase
      .from('facilities')
      .select('*')
      .eq('organization_id', masterUser.organization_id)

    if (ownFacilitiesError) {
      console.error('❌ Error fetching own facilities:', ownFacilitiesError)
      return
    }

    console.log(`\n🏢 Facilities for your organization:`)
    if (ownFacilities.length === 0) {
      console.log('   ❌ No facilities found for your organization')
      
      // Check if there are any facilities we can reassign
      const facilitiesToReassign = allFacilities.filter(f => 
        f.created_by === masterUser.id || 
        !f.organization_id || 
        f.organization_id !== masterUser.organization_id
      )

      if (facilitiesToReassign.length > 0) {
        console.log('\n🔧 Fixing facility assignments...')
        
        for (const facility of facilitiesToReassign.slice(0, 3)) { // Take first 3
          const { data: updated, error: updateError } = await supabase
            .from('facilities')
            .update({
              organization_id: masterUser.organization_id,
              status: 'active'
            })
            .eq('id', facility.id)
            .select()
            .single()

          if (updateError) {
            console.error(`   ❌ Failed to update ${facility.name}:`, updateError)
          } else {
            console.log(`   ✅ Assigned ${facility.name} to your organization`)
          }
        }
      } else {
        // Create a test facility
        console.log('\n🔧 Creating a test facility...')
        
        const facilityData = {
          name: 'Master Admin Test Facility',
          facility_type: 'Office',
          address: '123 Main Street, Test City, CA 90210',
          status: 'active',
          square_footage: 10000,
          facility_condition_index: 90,
          description: 'Test facility for master admin organization',
          rooms: 15,
          year_built: 2022,
          created_by: masterUser.id,
          organization_id: masterUser.organization_id
        }

        const { data: newFacility, error: createError } = await supabase
          .from('facilities')
          .insert(facilityData)
          .select()
          .single()

        if (createError) {
          console.error('   ❌ Failed to create facility:', createError)
        } else {
          console.log(`   ✅ Created facility: ${newFacility.name}`)
        }
      }
    } else {
      ownFacilities.forEach((facility, index) => {
        const status = facility.status === 'active' ? '✅' : '❌'
        console.log(`   ${index + 1}. ${facility.name} ${status}`)
        console.log(`      Status: ${facility.status}`)
        
        if (facility.status !== 'active') {
          console.log(`      🔧 Need to activate this facility`)
        }
      })

      // Activate any inactive facilities
      const inactiveFacilities = ownFacilities.filter(f => f.status !== 'active')
      if (inactiveFacilities.length > 0) {
        console.log('\n🔧 Activating inactive facilities...')
        
        for (const facility of inactiveFacilities) {
          const { error: activateError } = await supabase
            .from('facilities')
            .update({ status: 'active' })
            .eq('id', facility.id)

          if (activateError) {
            console.error(`   ❌ Failed to activate ${facility.name}:`, activateError)
          } else {
            console.log(`   ✅ Activated ${facility.name}`)
          }
        }
      }
    }

    // Final check
    const { data: finalFacilities, error: finalError } = await supabase
      .from('facilities')
      .select('id, name, status')
      .eq('organization_id', masterUser.organization_id)
      .eq('status', 'active')

    if (finalError) {
      console.error('❌ Error in final check:', finalError)
      return
    }

    console.log(`\n✅ Final result: ${finalFacilities.length} active facilities for your organization`)
    finalFacilities.forEach(facility => {
      console.log(`   ✅ ${facility.name}`)
    })

    if (finalFacilities.length > 0) {
      console.log('\n🎉 Success! You can now use the Share Issue Form functionality.')
    } else {
      console.log('\n❌ Still no active facilities. Please check the database manually.')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAndFixFacilities() 