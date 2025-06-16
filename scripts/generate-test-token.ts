import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function generateTestToken() {
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Make POST request to our token generation endpoint
    const response = await fetch('http://localhost:3000/api/tokens/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata: {
          system: 'HVAC',
          location: 'Building A'
        },
        expiresInDays: 7
      }),
    });

    const data = await response.json();
    
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
    console.error('Error generating token:', error);
  }
}

// Run the script
generateTestToken(); 