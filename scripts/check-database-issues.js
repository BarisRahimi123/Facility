#!/usr/bin/env node

/**
 * Script to check database issues found in Vercel logs
 * 1. Check if reservations table has proper foreign key to fields
 * 2. Check if users table has name column for maintenance queries
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve('.env.local') });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseIssues() {
  console.log('🔍 Checking database issues...\n');

  try {
    // 1. Check if reservations table exists and has field_id column
    console.log('1. Checking reservations table structure...');
    const { data: reservationsInfo, error: reservationsError } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'reservations'
          AND column_name IN ('id', 'field_id', 'facility_id')
          ORDER BY ordinal_position;
        `
      });

    if (reservationsError) {
      console.log('   ❌ Error checking reservations table:', reservationsError.message);
    } else if (!reservationsInfo || reservationsInfo.length === 0) {
      console.log('   ❌ reservations table does not exist or has no field_id column');
    } else {
      console.log('   ✅ reservations table structure:');
      reservationsInfo.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
    }

    // 2. Check foreign key relationships for reservations
    console.log('\n2. Checking reservations foreign key constraints...');
    const { data: fkInfo, error: fkError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'reservations'
            AND tc.table_schema = 'public';
        `
      });

    if (fkError) {
      console.log('   ❌ Error checking foreign keys:', fkError.message);
    } else if (!fkInfo || fkInfo.length === 0) {
      console.log('   ❌ No foreign key constraints found for reservations table');
    } else {
      console.log('   ✅ reservations foreign key constraints:');
      fkInfo.forEach(fk => {
        console.log(`      - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    }

    // 3. Check users table structure
    console.log('\n3. Checking users table structure...');
    const { data: usersInfo, error: usersError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
          AND column_name IN ('id', 'name', 'email', 'first_name', 'last_name')
          ORDER BY ordinal_position;
        `
      });

    if (usersError) {
      console.log('   ❌ Error checking users table:', usersError.message);
    } else if (!usersInfo || usersInfo.length === 0) {
      console.log('   ❌ users table does not exist or missing key columns');
    } else {
      console.log('   ✅ users table structure:');
      usersInfo.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
      
      const hasName = usersInfo.some(col => col.column_name === 'name');
      if (!hasName) {
        console.log('   ⚠️  users table is missing "name" column - this will cause maintenance query errors');
      }
    }

    // 4. Test a simple reservations query to fields
    console.log('\n4. Testing reservations → fields relationship...');
    try {
      const { data: testReservations, error: testError } = await supabase
        .from('reservations')
        .select('id, field:fields(id, name)')
        .limit(1);

      if (testError) {
        console.log('   ❌ Error testing relationship:', testError.message);
        console.log('   📝 This is likely the PGRST200 error from Vercel logs');
      } else {
        console.log('   ✅ reservations → fields relationship works');
      }
    } catch (error) {
      console.log('   ❌ Error testing relationship:', error.message);
    }

    // 5. Test maintenance tasks query
    console.log('\n5. Testing maintenance tasks query...');
    try {
      const { data: testTasks, error: testTaskError } = await supabase
        .from('maintenance_tasks')
        .select(`
          id,
          title,
          task_assignments(
            id,
            user:users!task_assignments_user_id_fkey(name, email)
          )
        `)
        .limit(1);

      if (testTaskError) {
        console.log('   ❌ Error testing maintenance query:', testTaskError.message);
        console.log('   📝 This is likely the "column users_1.name does not exist" error from Vercel logs');
      } else {
        console.log('   ✅ maintenance tasks query works');
      }
    } catch (error) {
      console.log('   ❌ Error testing maintenance query:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkDatabaseIssues()
  .then(() => {
    console.log('\n✅ Database check completed');
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });
