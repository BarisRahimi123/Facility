import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function insertToken() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Insert the working token
    const { data, error } = await supabase
      .from('form_tokens')
      .upsert({
        token: '26592d3d5252b81356c48e30639dd3b766655042471b30997e7cbcc7ad0c8745',
        status: 'active',
        metadata: {
          system: 'HVAC',
          location: 'Building A'
        },
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      }, {
        onConflict: 'token',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Error inserting token:', error);
      return;
    }

    console.log('Token inserted successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

insertToken(); 