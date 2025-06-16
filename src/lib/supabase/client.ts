import { createBrowserClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      // Add storage adapter for Safari compatibility
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          // Try localStorage first
          const item = window.localStorage.getItem(key);
          if (item) return item;
          
          // Fallback to sessionStorage for Safari private mode
          try {
            return window.sessionStorage.getItem(key);
          } catch {
            return null;
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
    },
    cookieOptions: {
      name: 'sb-session',
      path: '/',
      // Use 'lax' for better Safari compatibility
      sameSite: 'lax',
      // Only use secure for HTTPS
      secure: typeof window !== 'undefined' && window.location?.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      // Don't set domain for localhost
      domain: undefined
    },
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return '';
        
        try {
          // Standard cookie parsing
          const cookies = document.cookie.split('; ');
          const cookie = cookies.find((row) => row.startsWith(`${name}=`));
          
          if (!cookie) {
            // Check localStorage as fallback for Safari
            const localStorageKey = `sb-${name}`;
            try {
              const localValue = localStorage.getItem(localStorageKey);
              if (localValue) {
                return localValue;
              }
            } catch {
              // Ignore localStorage errors
            }
            return '';
          }
          
          const value = cookie.split('=')[1];
          
          // Decode the value
          const decodedValue = decodeURIComponent(value);
          
          // Handle base64 encoded values
          if (decodedValue.startsWith('base64-')) {
            const base64Value = decodedValue.slice(7);
            const jsonStr = atob(base64Value);
            if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
              return JSON.parse(jsonStr);
            }
            return jsonStr;
          }
          
          // Try to parse as JSON
          if (decodedValue.startsWith('{') || decodedValue.startsWith('[')) {
            try {
              return JSON.parse(decodedValue);
            } catch {
              return decodedValue;
            }
          }
          
          return decodedValue;
        } catch (error) {
          console.error('Error reading cookie:', error);
          return '';
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof document === 'undefined') return;
        
        try {
          // Stringify objects/arrays
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
          
          // Encode JSON values as base64 for better compatibility
          const encodedValue = (stringValue.startsWith('{') || stringValue.startsWith('[')) ? 
            `base64-${btoa(stringValue)}` : 
            stringValue;
          
          // Build cookie string with Safari-compatible attributes
          let cookie = `${name}=${encodeURIComponent(encodedValue)}`;
          
          if (options.path) cookie += `; path=${options.path}`;
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
          
          // Only add SameSite for non-Safari or HTTPS
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          if (!isSafari || window.location.protocol === 'https:') {
            if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
          }
          
          // Only add secure for HTTPS
          if (window.location.protocol === 'https:') {
            cookie += '; secure';
          }
          
          document.cookie = cookie;
          
          // Also store in localStorage as fallback for Safari
          try {
            const localStorageKey = `sb-${name}`;
            localStorage.setItem(localStorageKey, stringValue);
          } catch {
            // Ignore localStorage errors
          }
        } catch (error) {
          console.error('Error setting cookie:', error);
        }
      },
      remove(name: string, options: CookieOptions) {
        if (typeof document === 'undefined') return;
        
        // Remove cookie
        document.cookie = `${name}=; max-age=0; path=${options.path || '/'}`;
        
        // Also remove from localStorage
        try {
          const localStorageKey = `sb-${name}`;
          localStorage.removeItem(localStorageKey);
        } catch {
          // Ignore localStorage errors
        }
      }
    }
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

  return createClient(supabaseUrl, supabaseServiceKey, {
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
