#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔧 Fixing SendGrid and Auth Issues...\n');

// Check current configuration
console.log('📋 Current Configuration:');
console.log('========================');
console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? '✅ Set (ends with ...' + process.env.SENDGRID_API_KEY.slice(-8) + ')' : '❌ Not set'}`);
console.log(`SendGrid From Email: ${process.env.SENDGRID_FROM_EMAIL || '❌ Not set'}`);
console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`Supabase Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}`);

console.log('\n📝 Action Items:');
console.log('================\n');

console.log('1️⃣ SENDGRID SETUP:');
console.log('-------------------');
console.log('a) Go to: https://app.sendgrid.com/settings/api_keys');
console.log('b) Create a new API key with FULL ACCESS');
console.log('c) Copy the key (starts with SG.)');
console.log('d) Update .env.local with the new key\n');

console.log('2️⃣ VERIFY SENDER EMAIL:');
console.log('------------------------');
console.log('a) Go to: https://app.sendgrid.com/settings/sender_auth');
console.log('b) Click "Single Sender Verification"');
console.log('c) Add and verify: ' + (process.env.SENDGRID_FROM_EMAIL || 'info@facilitycore.ai'));
console.log('d) Check your email for verification link\n');

console.log('3️⃣ FIX SIGN-OUT BUTTON:');
console.log('------------------------');
console.log('The sign-out fix will be applied automatically...\n');

// Create improved sign-out API route
const signOutRouteContent = `import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase signOut error:', error);
    }
    
    // Clear all auth-related cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Clear Supabase auth cookies
    const response = NextResponse.json(
      { success: true, message: 'Signed out successfully' },
      { status: 200 }
    );
    
    // Delete all auth-related cookies
    allCookies.forEach(cookie => {
      if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
        response.cookies.delete(cookie.name);
      }
    });
    
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method to sign out' });
}`;

// Update sign-out API route
const signOutRoutePath = path.join(__dirname, 'src', 'app', 'api', 'auth', 'signout', 'route.ts');
fs.writeFileSync(signOutRoutePath, signOutRouteContent);
console.log('✅ Updated sign-out API route');

// Create a test script for SendGrid
const testScript = `#!/bin/bash

echo "🧪 Testing SendGrid Configuration..."
echo ""

# Test if SendGrid is configured
echo "1. Checking API endpoint..."
curl -s http://localhost:3000/api/test-email | jq '.sendGridConfigured, .fromEmail' 2>/dev/null || echo "API not responding"

echo ""
echo "2. Sending test email..."
curl -X POST http://localhost:3000/api/test-email \\
  -H "Content-Type: application/json" \\
  -d '{"to": "85baris@gmail.com", "type": "test"}' \\
  -w "\\nHTTP Status: %{http_code}\\n"

echo ""
echo "📬 Check your email for the test message!"
echo ""
echo "If you see 'Unauthorized' error:"
echo "1. Create a new SendGrid API key"
echo "2. Verify your sender email"
echo "3. Update .env.local"
echo "4. Restart your dev server"
`;

fs.writeFileSync('test-sendgrid.sh', testScript);
fs.chmodSync('test-sendgrid.sh', '755');
console.log('✅ Created test-sendgrid.sh script');

// Create comprehensive sign-out test
const signOutTest = `#!/bin/bash

echo "🔐 Testing Sign-Out Functionality..."
echo ""

# Test the sign-out API endpoint
echo "Testing sign-out API..."
curl -X POST http://localhost:3000/api/auth/signout \\
  -H "Content-Type: application/json" \\
  -w "\\nHTTP Status: %{http_code}\\n"

echo ""
echo "✅ Sign-out API tested"
echo ""
echo "To fully test sign-out:"
echo "1. Sign in to your app"
echo "2. Click the sign-out button"
echo "3. You should be redirected to /auth/sign-in"
echo "4. Trying to access protected pages should redirect to sign-in"
`;

fs.writeFileSync('test-signout.sh', signOutTest);
fs.chmodSync('test-signout.sh', '755');
console.log('✅ Created test-signout.sh script');

console.log('\n✨ Fixes Applied!');
console.log('=================\n');
console.log('Next Steps:');
console.log('1. Update your SendGrid API key in .env.local');
console.log('2. Restart your dev server: npm run dev');
console.log('3. Test SendGrid: ./test-sendgrid.sh');
console.log('4. Test Sign-out: ./test-signout.sh');
console.log('\n📚 Documentation: SENDGRID_SETUP_GUIDE.md');

