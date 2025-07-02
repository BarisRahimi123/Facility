import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      // Storage adapter for Safari compatibility
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          try {
            return window.localStorage.getItem(key);
          } catch {
            // Fallback to sessionStorage for Safari private mode
            try {
              return window.sessionStorage.getItem(key);
            } catch {
              return null;
            }
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.setItem(key, value);
          } catch {
            // Fallback to sessionStorage for Safari private mode
            try {
              window.sessionStorage.setItem(key, value);
            } catch {
              console.warn('Unable to store auth data');
            }
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.removeItem(key);
            window.sessionStorage.removeItem(key);
          } catch {
            console.warn('Unable to remove auth data');
          }
        }
      }
    }
    // Let Supabase handle cookies with its default implementation
  });
}

// Export a singleton instance for convenience
export const supabase = createClient();

// Create a Supabase client with the service role key for server-side operations
export const getServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Missing Supabase environment variables');
    return null;
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper function to handle database operations with fallback to mock data
export async function withSupabase<T>(
  operation: (client: ReturnType<typeof createClient>) => Promise<T>,
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
