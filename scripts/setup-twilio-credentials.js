#!/usr/bin/env node

/**
 * Twilio Credentials Setup Helper
 * This script helps you add Twilio credentials to your .env.local file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env.local');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('🔐 Twilio Credentials Setup');
console.log('===========================\n');

async function setupTwilioCredentials() {
  try {
    // Check if .env.local exists
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✅ Found existing .env.local file\n');
    } else {
      console.log('📝 Creating new .env.local file\n');
    }

    console.log('Please enter your Twilio credentials:');
    console.log('(You can find these in your Twilio Console at https://console.twilio.com)\n');

    // Get Twilio Account SID
    const accountSid = await question('Twilio Account SID (starts with AC): ');
    if (!accountSid.startsWith('AC')) {
      console.log('⚠️  Warning: Account SID should start with "AC"');
    }

    // Get Twilio Auth Token
    const authToken = await question('Twilio Auth Token: ');

    // Get Twilio Phone Number
    const phoneNumber = await question('Twilio Phone Number (with country code, e.g., +1234567890): ');
    if (!phoneNumber.startsWith('+')) {
      console.log('⚠️  Warning: Phone number should start with "+" and country code');
    }

    // Remove existing Twilio variables if present
    const lines = envContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.startsWith('TWILIO_ACCOUNT_SID=') &&
      !line.startsWith('TWILIO_AUTH_TOKEN=') &&
      !line.startsWith('TWILIO_PHONE_NUMBER=')
    );

    // Add new Twilio variables
    const twilioVars = [
      '',
      '# Twilio SMS Configuration',
      `TWILIO_ACCOUNT_SID=${accountSid}`,
      `TWILIO_AUTH_TOKEN=${authToken}`,
      `TWILIO_PHONE_NUMBER=${phoneNumber}`,
      ''
    ];

    // Combine content
    const newContent = filteredLines.join('\n') + twilioVars.join('\n');

    // Write to file
    fs.writeFileSync(envPath, newContent);

    console.log('\n✅ Twilio credentials saved to .env.local');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your Next.js development server');
    console.log('2. Test SMS sending with the test endpoint');
    console.log('\n🔒 Security reminder: Never commit .env.local to git!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

setupTwilioCredentials();



