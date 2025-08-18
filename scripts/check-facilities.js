#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFacilities() {
  console.log('🔍 Checking all facilities in database...\n');

  // Get all facilities
  const { data: facilities, error } = await supabase
    .from('facilities')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching facilities:', error);
    return;
  }

  if (!facilities || facilities.length === 0) {
    console.log('📭 No facilities found in database');
    return;
  }

  console.log(`✅ Found ${facilities.length} facilities:\n`);
  
  facilities.forEach((facility, index) => {
    console.log(`${index + 1}. ${facility.name}`);
    console.log(`   ID: ${facility.id}`);
    console.log(`   Organization: ${facility.organization_id}`);
    console.log(`   Type: ${facility.type || 'Not set'}`);
    console.log(`   Status: ${facility.status || 'Not set'}`);
    console.log(`   Created: ${facility.created_at}`);
    console.log(`   Created By: ${facility.created_by || 'Unknown'}`);
    console.log('');
  });

  // Check for Woodlake High School specifically
  const woodlake = facilities.find(f => 
    f.name && f.name.toLowerCase().includes('woodlake')
  );
  
  if (woodlake) {
    console.log('🎯 Found Woodlake High School!');
    console.log('   Full details:', JSON.stringify(woodlake, null, 2));
  } else {
    console.log('❌ Woodlake High School not found in the list');
  }

  // Group by organization
  const byOrg = {};
  facilities.forEach(f => {
    const orgId = f.organization_id || 'No Organization';
    if (!byOrg[orgId]) byOrg[orgId] = [];
    byOrg[orgId].push(f.name);
  });

  console.log('\n📊 Facilities by Organization:');
  Object.entries(byOrg).forEach(([orgId, names]) => {
    console.log(`\n${orgId}:`);
    names.forEach(name => console.log(`  - ${name}`));
  });
}

checkFacilities().catch(console.error);