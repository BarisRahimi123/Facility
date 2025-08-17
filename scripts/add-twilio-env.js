#!/usr/bin/env node

/**
 * Add Twilio credentials to .env.local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');

// Your Twilio credentials
const twilioConfig = `
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID_HERE
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN_HERE
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER_HERE
`;

try {
  let envContent = '';
  
  // Check if .env.local exists and read it
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env.local file');
    
    // Remove existing Twilio config if present
    const lines = envContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.includes('TWILIO_ACCOUNT_SID') &&
      !line.includes('TWILIO_AUTH_TOKEN') &&
      !line.includes('TWILIO_PHONE_NUMBER')
    );
    envContent = filteredLines.join('\n');
  } else {
    console.log('📝 Creating new .env.local file');
    // Add basic Supabase config placeholders
    envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
`;
  }
  
  // Add Twilio config
  const newContent = envContent.trim() + '\n' + twilioConfig;
  
  // Write to file
  fs.writeFileSync(envPath, newContent);
  
  console.log('\n✅ Twilio credentials added to .env.local');
  console.log('\n📋 Credentials added:');
  console.log('   Account SID: [configured]');
  console.log('   Phone Number: +18582392011');
  console.log('   Auth Token: [hidden for security]');
  
  console.log('\n⚠️  IMPORTANT SECURITY STEPS:');
  console.log('1. Go to https://console.twilio.com');
  console.log('2. Navigate to Account → API keys & tokens');
  console.log('3. Generate a NEW Auth Token (the current one is exposed)');
  console.log('4. Update the TWILIO_AUTH_TOKEN in .env.local with the new token');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Make sure your Supabase credentials are also set in .env.local');
  console.log('2. Restart your Next.js development server: npm run dev');
  console.log('3. Test SMS sending from your application');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}


