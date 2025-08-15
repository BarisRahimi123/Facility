import type { CookieOptions } from '@supabase/ssr';

export const cookieOptions: Partial<CookieOptions> = {
  // Set cookies to persist for 7 days
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  
  // Use 'lax' for better compatibility while still providing CSRF protection
  sameSite: 'lax',
  
  // Only use secure cookies in production
  secure: process.env.NODE_ENV === 'production',
  
  // HttpOnly cookies for security (prevent XSS access)
  httpOnly: true,
  
  // Set path to root so cookies work across all routes
  path: '/',
}; 