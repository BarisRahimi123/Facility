import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

/**
 * Global Supabase client with enhanced reliability settings
 */
export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'mock-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // More secure authentication flow
    },
    global: {
      headers: {
        'X-Client-Info': 'fieldwire-web',
      },
    },
    // Set longer timeouts to prevent issues on slower connections
    realtime: {
      timeout: 60000, // 60 seconds
    },
  }
);

/**
 * Helper function to check if user is authenticated with a timeout
 * @param timeoutMs - Timeout in milliseconds
 * @returns A promise that resolves with the session or null
 */
export async function checkAuth(timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const { data, error } = await supabase.auth.getSession();
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Auth check error:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Helper function to refresh the session
 * @returns A promise that resolves with the refreshed session or null
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
} 