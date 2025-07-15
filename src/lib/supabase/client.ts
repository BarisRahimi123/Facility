import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables are not set!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    throw new Error('Supabase environment variables are required. Please check your .env.local file.');
  }

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

// Export a singleton instance for convenience - but only create it when accessed
let supabaseInstance: ReturnType<typeof createClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    if (!supabaseInstance) {
      supabaseInstance = createClient();
    }
    return Reflect.get(supabaseInstance, prop, receiver);
  }
});

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
