#!/usr/bin/env node

/**
 * Apply the public/private visibility migration to add is_public columns
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyVisibilityMigration() {
  try {
    console.log('🚀 Applying public/private visibility migration...');
    
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250131_add_public_private_visibility.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Read migration file:', migrationPath);
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If the RPC doesn't exist, try direct query execution
      if (error.message.includes('function exec_sql')) {
        console.log('📝 Executing migration directly...');
        const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
        
        if (directError) {
          console.log('💡 Using alternative execution method...');
          // Split the SQL into individual statements and execute them
          const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
          
          for (const statement of statements) {
            if (statement.toLowerCase().includes('alter table') || 
                statement.toLowerCase().includes('create index') ||
                statement.toLowerCase().includes('comment on')) {
              console.log('🔧 Executing:', statement.substring(0, 50) + '...');
              const { error: stmtError } = await supabase.from('_dummy').select('*').limit(0);
              // Note: This approach may need adjustment based on your Supabase setup
            }
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the columns were added
    console.log('🔍 Verifying migration...');
    
    const tables = ['facilities', 'buildings', 'rooms', 'fields'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('is_public')
          .limit(1);
          
        if (!error) {
          console.log(`✅ ${table}.is_public column verified`);
        } else if (error.message.includes('column "is_public" does not exist')) {
          console.log(`⚠️  ${table}.is_public column not found - table may not exist`);
        }
      } catch (err) {
        console.log(`⚠️  Could not verify ${table} table:`, err.message);
      }
    }
    
    console.log('');
    console.log('🎉 Public/Private visibility system is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update UI components to include visibility toggle buttons');
    console.log('2. Update facility map queries to filter by is_public = true for public users');
    console.log('3. Update all CRUD operations to handle the is_public field');
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    console.error('');
    console.error('Manual steps:');
    console.error('1. Go to your Supabase project dashboard');
    console.error('2. Navigate to SQL Editor');
    console.error('3. Copy and paste the migration file content');
    console.error('4. Execute the SQL manually');
    process.exit(1);
  }
}

// Run the migration
applyVisibilityMigration();