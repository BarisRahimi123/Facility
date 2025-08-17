#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SendGrid configuration
const SENDGRID_CONFIG = {
  SENDGRID_API_KEY: 'YOUR_SENDGRID_API_KEY_HERE',
  SENDGRID_FROM_EMAIL: 'info@facilitycore.ai',
  SENDGRID_FROM_NAME: 'Facilitycore'
};

// Path to .env.local file
const envPath = path.join(process.cwd(), '.env.local');

console.log('📧 Setting up SendGrid environment variables...\n');

// Check if .env.local exists
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found existing .env.local file');
} else {
  console.log('📝 Creating new .env.local file');
}

// Check for existing SendGrid configuration
const hasExistingSendGrid = envContent.includes('SENDGRID_API_KEY');

if (hasExistingSendGrid) {
  console.log('\n⚠️  WARNING: SendGrid configuration already exists in .env.local');
  console.log('Please manually verify the configuration is correct.\n');
} else {
  // Add SendGrid configuration
  const sendGridSection = `
# SendGrid Configuration
SENDGRID_API_KEY=${SENDGRID_CONFIG.SENDGRID_API_KEY}
SENDGRID_FROM_EMAIL=${SENDGRID_CONFIG.SENDGRID_FROM_EMAIL}
SENDGRID_FROM_NAME=${SENDGRID_CONFIG.SENDGRID_FROM_NAME}

# Optional: SendGrid Templates (add your template IDs here)
SENDGRID_WELCOME_TEMPLATE_ID=
SENDGRID_RESET_PASSWORD_TEMPLATE_ID=
SENDGRID_INVITATION_TEMPLATE_ID=
`;

  // Append to .env.local
  fs.appendFileSync(envPath, sendGridSection);
  console.log('✅ Added SendGrid configuration to .env.local\n');
}

// Display next steps
console.log('📋 Next Steps:');
console.log('==============\n');
console.log('1. ✅ Environment variables have been added to .env.local');
console.log('2. 🔄 Restart your Next.js development server');
console.log('3. 🌐 Configure Supabase Custom SMTP:');
console.log('   - Go to Supabase Dashboard → Settings → Auth');
console.log('   - Enable Custom SMTP and use these settings:');
console.log('     • Host: smtp.sendgrid.net');
console.log('     • Port: 587');
console.log('     • Username: apikey');
console.log('     • Password: [Your SendGrid API Key]');
console.log('     • Sender email: info@facilitycore.ai');
console.log('     • Sender name: Facilitycore');
console.log('4. 🧪 Test the integration:');
console.log('   - Send a test email: curl -X POST http://localhost:3000/api/test-email \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"to": "your-email@example.com", "type": "test"}\'');
console.log('\n📚 Full setup guide: SENDGRID_SETUP_GUIDE.md');
console.log('\n✨ Done!');
