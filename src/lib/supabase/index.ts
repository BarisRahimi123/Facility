/**
 * Unified Supabase client implementation for browser/client components
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// Environment variables
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Supabase environment variables');
  }
}

/**
 * Create a Supabase client for browser/client components
 */
export function createClientBrowser() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'supabase.auth.token',
      debug: process.env.NODE_ENV === 'development',
    },
    global: {
      // Add a timeout to prevent hanging requests
      fetch: (url, options) => {
        const controller = new AbortController();
        const { signal } = controller;
        
        // Create a timeout that will abort the request after 10 seconds
        const timeoutId = setTimeout(() => {
          console.warn('Supabase request timed out:', url);
          controller.abort();
        }, 10000);
        
        return fetch(url, { ...options, signal })
          .finally(() => clearTimeout(timeoutId));
      }
    }
  });
}

// Export a singleton instance for client components
export const supabase = createClientBrowser();  