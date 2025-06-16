const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function generateTestToken() {
  try {
    // Make POST request to our token generation endpoint
    const response = await axios.post('http://localhost:3000/api/tokens/generate', {
      metadata: {
        system: 'HVAC',
        location: 'Building A'
      },
      expiresInDays: 7
    });

    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate token');
    }

    console.log('Token generated successfully!');
    console.log('Token:', data.data.token);
    console.log('Expires at:', data.data.expiresAt);
    console.log('');
    console.log('You can now access the report at:');
    console.log(`http://localhost:3000/report/${data.data.token}?system=HVAC&location=Building+A`);
  } catch (error) {
    console.error('Error generating token:', error.response?.data || error.message);
  }
}

// Run the script
generateTestToken(); 