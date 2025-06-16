'use server';

/**
 * Supabase client for server components and API routes
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { CookieOptions } from '@supabase/ssr';
import type { Database } from '../database.types';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for server components
 * This function should be used in server components or API routes
 * 
 * @param cookieStore Cookie store to use for authentication
 */
export async function createServerSupabaseClient(cookieStore?: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string) => void;
}) {
  // If no cookie store is provided, create a simple in-memory cookie store
  const defaultCookieStore = {
    cookies: new Map<string, string>(),
    get(name: string) {
      const value = this.cookies.get(name);
      return value ? { value } : undefined;
    },
    set(name: string, value: string, options: CookieOptions) {
      this.cookies.set(name, value);
    },
    remove(name: string) {
      this.cookies.delete(name);
    }
  };

  const store = cookieStore || defaultCookieStore;

  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return store.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          store.remove(name);
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role for admin operations
 */
export async function createServiceSupabaseClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// For backward compatibility
export const createClient = createServerSupabaseClient;