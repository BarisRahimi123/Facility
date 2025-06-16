import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for server-side operations
export const getServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase environment variables');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper function to handle database operations with fallback to mock data
export async function withSupabase<T>(
  operation: (client: NonNullable<ReturnType<typeof getServiceRoleClient>>) => Promise<T>,
  mockData: T
): Promise<T> {
  const client = getServiceRoleClient();
  if (!client) {
    console.warn('Using mock data due to missing Supabase configuration');
    return mockData;
  }

  try {
    return await operation(client);
  } catch (error) {
    console.error('Database operation failed:', error);
    console.warn('Falling back to mock data');
    return mockData;
  }
} 