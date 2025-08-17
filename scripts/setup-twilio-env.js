#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Twilio configuration template
const twilioConfig = {
  TWILIO_ACCOUNT_SID: 'your_account_sid_here',
  TWILIO_AUTH_TOKEN: 'your_auth_token_here',
  TWILIO_PHONE_NUMBER: '+1234567890', // Your Twilio phone number in E.164 format
  TWILIO_MESSAGING_SERVICE_SID: 'optional_messaging_service_sid' // Optional for advanced features
};

// Path to .env.local
const envPath = path.join(__dirname, '..', '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  fs.writeFileSync(envPath, '');
}

// Read existing content
let envContent = fs.readFileSync(envPath, 'utf-8');

// Check for existing Twilio configuration
const hasTwilioConfig = envContent.includes('TWILIO_ACCOUNT_SID');

if (hasTwilioConfig) {
  console.log('⚠️  Twilio configuration already exists in .env.local');
  console.log('Please update the values manually if needed.');
} else {
  // Add Twilio configuration
  const twilioSection = `
# Twilio SMS Configuration
# Get these from https://console.twilio.com
TWILIO_ACCOUNT_SID=${twilioConfig.TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${twilioConfig.TWILIO_AUTH_TOKEN}
TWILIO_PHONE_NUMBER=${twilioConfig.TWILIO_PHONE_NUMBER}
# TWILIO_MESSAGING_SERVICE_SID=${twilioConfig.TWILIO_MESSAGING_SERVICE_SID}
`;

  envContent += twilioSection;
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Twilio configuration added to .env.local');
  console.log('\n📋 Next steps:');
  console.log('1. Sign up for Twilio at https://www.twilio.com/try-twilio');
  console.log('2. Get your Account SID and Auth Token from the Twilio Console');
  console.log('3. Purchase a phone number from Twilio (or use a trial number)');
  console.log('4. Update the values in .env.local with your actual credentials');
  console.log('5. Restart your Next.js development server');
  console.log('\n💡 Tips:');
  console.log('- Trial accounts can send SMS to verified phone numbers only');
  console.log('- Use E.164 format for phone numbers (+1234567890)');
  console.log('- Consider using a Messaging Service for advanced features');
}

console.log('\n📱 Test your SMS setup at: http://localhost:3000/api/test-sms');
console.log('   Example: curl -X POST http://localhost:3000/api/test-sms \\');
console.log('            -H "Content-Type: application/json" \\');
console.log('            -d \'{"to": "+1234567890"}\'');

