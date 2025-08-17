#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📋 Applying SMS Consent System Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250201_create_sms_consent_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found at:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration file loaded successfully');
    console.log('⏳ Executing migration...\n');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, provide manual instructions
      if (error.code === 'PGRST202') {
        console.log('⚠️  Cannot execute migration automatically.\n');
        console.log('Please apply the migration manually:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy the contents of:');
        console.log(`   ${migrationPath}`);
        console.log('4. Paste and execute in SQL Editor\n');
        
        console.log('Alternatively, you can copy the migration from here:');
        console.log('=' .repeat(50));
        console.log(migrationSQL.substring(0, 500) + '...\n[Migration truncated - see full file]');
        console.log('=' .repeat(50));
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration applied successfully!\n');
    }

    // Check if tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = [
      'sms_consent_records',
      'sms_consent_history',
      'sms_message_log',
      'sms_keywords'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}' - NOT FOUND`);
      } else {
        console.log(`✅ Table '${table}' - Created (${count || 0} records)`);
      }
    }

    // Check for default keywords
    const { data: keywords, error: keywordError } = await supabase
      .from('sms_keywords')
      .select('keyword, action')
      .order('keyword');

    if (!keywordError && keywords && keywords.length > 0) {
      console.log(`\n📱 SMS Keywords configured: ${keywords.length}`);
      console.log('   Keywords:', keywords.map(k => k.keyword).join(', '));
    }

    console.log('\n🎉 SMS Consent System setup complete!');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:3000/sms-consent to test the consent form');
    console.log('2. Submit the consent page URL to Twilio for verification');
    console.log('3. Configure your Twilio credentials in .env.local');
    console.log('\nFor Twilio verification, use:');
    console.log('   URL: https://your-domain.com/sms-consent');
    console.log('   Documentation: TWILIO_SMS_CONSENT_PROOF.md');

  } catch (error) {
    console.error('❌ Error applying migration:', error.message || error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();