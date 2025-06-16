import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

export async function createServerSupabaseClient(cookieStore: {
  get: (name: string) => { value: string } | undefined;
  set: (props: { name: string; value: string } & CookieOptions) => void;
  delete: (props: { name: string } & CookieOptions) => void;
}) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          if (!cookie?.value) return '';
          try {
            // First decode URI component
            const decodedValue = decodeURIComponent(cookie.value);
            // If it's a base64 value, decode it first
            if (decodedValue.startsWith('base64-')) {
              const base64Value = decodedValue.slice(7);
              const jsonStr = Buffer.from(base64Value, 'base64').toString();
              // Try to parse as JSON if it looks like JSON
              if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
                return JSON.parse(jsonStr);
              }
              return jsonStr;
            }
            // Try to parse as JSON if it looks like JSON
            if (decodedValue.startsWith('{') || decodedValue.startsWith('[')) {
              return JSON.parse(decodedValue);
            }
            return decodedValue;
          } catch {
            return '';
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // If value is an object or array, stringify it first
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
            // For JSON values, encode as base64
            const encodedValue = (stringValue.startsWith('{') || stringValue.startsWith('[')) ? 
              `base64-${Buffer.from(stringValue).toString('base64')}` : 
              stringValue;
            cookieStore.set({
              name,
              value: encodeURIComponent(encodedValue),
              ...options,
              sameSite: 'lax',
              httpOnly: true,
            });
          } catch {
            // Handle encoding errors gracefully
          }
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({
            name,
            ...options,
            sameSite: 'lax',
            httpOnly: true,
          });
        },
      },
    }
  );
} 