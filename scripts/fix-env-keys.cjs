const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Supabase Environment Variables Fixer\n');
console.log('This will help you create a proper .env.local file with correct Supabase keys.\n');

console.log('📋 First, get your keys from Supabase Dashboard:');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select your project: ahntaamtsypranvnofxy');
console.log('3. Go to: Settings → API');
console.log('4. Copy the keys EXACTLY as shown\n');

const questions = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    question: 'Enter Project URL (should be: https://ahntaamtsypranvnofxy.supabase.co): ',
    default: 'https://ahntaamtsypranvnofxy.supabase.co'
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    question: 'Paste the ANON PUBLIC key (starts with eyJ, very long): ',
    validate: (value) => {
      if (!value.startsWith('eyJ')) return 'Key should start with "eyJ"';
      if (value.length < 100) return 'Key seems too short';
      const parts = value.split('.');
      if (parts.length !== 3) return 'Invalid JWT format';
      return null;
    }
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    question: 'Paste the SERVICE ROLE key (starts with eyJ, very long, different from anon): ',
    validate: (value) => {
      if (!value.startsWith('eyJ')) return 'Key should start with "eyJ"';
      if (value.length < 100) return 'Key seems too short';
      const parts = value.split('.');
      if (parts.length !== 3) return 'Invalid JWT format';
      return null;
    }
  }
];

const answers = {};

async function askQuestion(questionObj) {
  return new Promise((resolve) => {
    rl.question(questionObj.question, (answer) => {
      const trimmed = answer.trim();
      
      if (questionObj.validate) {
        const error = questionObj.validate(trimmed);
        if (error) {
          console.log(`❌ ${error}`);
          return askQuestion(questionObj).then(resolve);
        }
      }
      
      if (!trimmed && questionObj.default) {
        resolve(questionObj.default);
      } else {
        resolve(trimmed);
      }
    });
  });
}

async function main() {
  try {
    for (const question of questions) {
      answers[question.key] = await askQuestion(question);
      console.log(`✅ ${question.key} set\n`);
    }

    // Create the .env.local content
    const envContent = `# Supabase Configuration (Generated: ${new Date().toISOString()})
NEXT_PUBLIC_SUPABASE_URL=${answers.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${answers.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${answers.SUPABASE_SERVICE_ROLE_KEY}

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=info@facilitycore.ai
SENDGRID_FROM_NAME=FacilityCore

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYmFyaXMtcmFoaW1pIiwiYSI6ImNtNGQ4eWVsODBxc3gyaXF6MDJqZzN1ZWwifQ.D_bPkLzKOTOI9IaFsVktEQ

# Development
NODE_ENV=development
`;

    // Backup existing file
    if (fs.existsSync('.env.local')) {
      fs.copyFileSync('.env.local', '.env.local.backup');
      console.log('📁 Backed up existing .env.local to .env.local.backup');
    }

    // Write new file
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ Created new .env.local file');

    // Test the new configuration
    console.log('\n🧪 Testing new configuration...');
    
    // Load the new env
    require('dotenv').config({ path: '.env.local' });
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from('users').select('count').limit(1);
    
    if (error && error.message.includes('Invalid API key')) {
      console.log('❌ Keys are still invalid. Please double-check them in Supabase dashboard.');
    } else if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('✅ Keys are valid! Users table needs to be created.');
      console.log('👉 Next step: Run the database migration');
    } else {
      console.log('✅ Configuration is working perfectly!');
    }

    console.log('\n🚀 Next steps:');
    console.log('1. Restart your Next.js server: npm run dev');
    console.log('2. Try signing in again');
    console.log('3. If users table missing, run the migration SQL');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
