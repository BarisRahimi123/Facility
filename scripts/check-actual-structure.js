#!/usr/bin/env node

/**
 * Check actual database structure to understand what exists
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve('.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkActualStructure() {
  console.log('🔍 Checking actual database structure...\n');

  try {
    // Check what tables exist
    console.log('1. Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase.rpc('exec', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('   ❌ Error:', tablesError.message);
    } else {
      console.log('   ✅ Existing tables:');
      tables.forEach(table => console.log(`      - ${table.table_name}`));
    }

    // Check users table structure
    console.log('\n2. Checking users table structure...');
    const { data: usersColumns, error: usersError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `
    });

    if (usersError) {
      console.log('   ❌ Error:', usersError.message);
    } else if (!usersColumns || usersColumns.length === 0) {
      console.log('   ❌ Users table does not exist');
    } else {
      console.log('   ✅ Users table columns:');
      usersColumns.forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
    }

    // Check fields table structure  
    console.log('\n3. Checking fields table structure...');
    const { data: fieldsColumns, error: fieldsError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fields'
        ORDER BY ordinal_position;
      `
    });

    if (fieldsError) {
      console.log('   ❌ Error:', fieldsError.message);
    } else if (!fieldsColumns || fieldsColumns.length === 0) {
      console.log('   ❌ Fields table does not exist');
    } else {
      console.log('   ✅ Fields table exists with', fieldsColumns.length, 'columns');
    }

    // Check reservations table structure
    console.log('\n4. Checking reservations table structure...');
    const { data: reservationsColumns, error: reservationsError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'reservations'
        ORDER BY ordinal_position;
      `
    });

    if (reservationsError) {
      console.log('   ❌ Error:', reservationsError.message);
    } else if (!reservationsColumns || reservationsColumns.length === 0) {
      console.log('   ❌ Reservations table does not exist');
    } else {
      console.log('   ✅ Reservations table exists with', reservationsColumns.length, 'columns');
      // Show first few columns
      reservationsColumns.slice(0, 5).forEach(col => {
        console.log(`      - ${col.column_name}: ${col.data_type}`);
      });
      console.log('      ...');
    }

    // Check if maintenance_tasks table exists
    console.log('\n5. Checking maintenance_tasks table...');
    const { data: maintenanceColumns, error: maintenanceError } = await supabase.rpc('exec', {
      sql: `
        SELECT COUNT(*) as column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'maintenance_tasks';
      `
    });

    if (maintenanceError) {
      console.log('   ❌ Error:', maintenanceError.message);
    } else if (!maintenanceColumns || maintenanceColumns[0].column_count === 0) {
      console.log('   ❌ Maintenance_tasks table does not exist');
    } else {
      console.log('   ✅ Maintenance_tasks table exists');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkActualStructure();
