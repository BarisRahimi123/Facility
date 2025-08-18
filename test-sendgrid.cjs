require('dotenv').config({ path: '.env.local' });

// Test SendGrid directly
const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

console.log('🔧 Testing SendGrid configuration...');
console.log('API Key present:', !!apiKey);
console.log('API Key format:', apiKey ? (apiKey.startsWith('SG.') ? 'Valid' : 'Invalid') : 'Missing');
console.log('From email:', fromEmail);

if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY not found in environment');
  process.exit(1);
}

if (!apiKey.startsWith('SG.')) {
  console.error('❌ Invalid SendGrid API key format. Should start with "SG."');
  process.exit(1);
}

sgMail.setApiKey(apiKey);
console.log('✅ SendGrid API key set');

// Test email sending
async function testSendEmail() {
  const msg = {
    to: '85baris@gmail.com', // Send to yourself for testing
    from: {
      email: fromEmail,
      name: 'FacilityCore Test'
    },
    subject: 'SendGrid Test Email - FacilityCore',
    text: 'This is a test email to verify SendGrid is working correctly.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #007aff;">SendGrid Test - FacilityCore</h1>
        <p>This is a test email to verify that SendGrid is configured correctly for FacilityCore.</p>
        <p>If you received this email, SendGrid is working properly!</p>
        <p style="color: #666; font-size: 14px;">
          Sent at: ${new Date().toISOString()}<br>
          From: ${fromEmail}
        </p>
      </div>
    `
  };

  try {
    console.log('📧 Sending test email...');
    const [response] = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully!');
    console.log('Status Code:', response.statusCode);
    console.log('Message ID:', response.headers['x-message-id']);
    console.log('Headers:', response.headers);
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    if (error.response) {
      console.error('Response body:', error.response.body);
      console.error('Status code:', error.response.statusCode);
    }
  }
}

testSendEmail();
