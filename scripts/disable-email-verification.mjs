#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

console.log('🔧 Email Verification Quick Fix\n');
console.log('Since you\'re not receiving verification emails, here\'s how to disable email verification:\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : '';

console.log('📍 Step 1: Open this link in your browser:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/auth/users\n`);

console.log('📍 Step 2: Go to Authentication → Settings');
console.log('   Direct link: https://supabase.com/dashboard/project/' + projectRef + '/auth/settings\n');

console.log('📍 Step 3: Scroll down to "Email Settings"');
console.log('   • Find "Enable email confirmations"');
console.log('   • Toggle it OFF (disable it)');
console.log('   • Click "Save"\n');

console.log('✅ After disabling email verification:');
console.log('   • Go back to the sign-up page');
console.log('   • Sign up again with any email');
console.log('   • You\'ll be logged in immediately without needing email verification!\n');

console.log('⚠️  Remember: This is for development only!');
console.log('   Re-enable email verification before going to production.\n');

console.log('🔍 Alternative: Manual User Verification');
console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/auth/users`);
console.log('   2. Find your email: bid4wgcc@gmail.com');
console.log('   3. Click on the user');
console.log('   4. Click "Verify Email" button\n');

console.log('📧 For production, you\'ll need to:');
console.log('   • Configure a custom SMTP provider (SendGrid, Mailgun, etc.)');
console.log('   • Or use Supabase\'s paid plan for better email delivery\n'); 