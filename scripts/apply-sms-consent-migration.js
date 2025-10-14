#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('SMS Consent Migration Setup');
console.log('==========================\n');

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250201_sms_consent_simple.sql');
const migrationContent = fs.readFileSync(migrationPath, 'utf8');

console.log('This script will help you apply the SMS consent migration to your Supabase database.\n');
console.log('Steps to apply the migration:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Create a new query');
console.log('4. Copy and paste the migration SQL below');
console.log('5. Run the query\n');

console.log('Migration file location:', migrationPath);
console.log('\n' + '='.repeat(80) + '\n');
console.log('COPY EVERYTHING BELOW THIS LINE:');
console.log('='.repeat(80) + '\n');
console.log(migrationContent);
console.log('\n' + '='.repeat(80) + '\n');

console.log('After applying the migration, you will have:');
console.log('- sms_consent_records table for tracking user consent');
console.log('- sms_notification_preferences table for user preferences');
console.log('- sms_audit_log table for tracking SMS activity');
console.log('- Helper functions for consent management');
console.log('- Indexes for performance');
console.log('\nNote: If tables already exist, the migration will skip them (IF NOT EXISTS).');