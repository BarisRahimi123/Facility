import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/dashboard',
  '/auth',
  '/auth/sign-in',
  '/auth/sign-in-simple',
  '/auth/sign-in-new',
  '/auth/sign-up',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/callback',
  '/auth/accept-invitation',
  '/(auth)',
  '/(auth)/sign-in',
  '/(auth)/sign-up',
  '/(auth)/reset-password',
  '/(auth)/update-password',
  '/test-auth-route',
  '/auth-debug',
  '/auth-test',
  '/api/auth/test-login',
  '/api/test-db-connection',
  '/api/forms/submit',
  '/api/forms/share',
  '/api/tokens/validate',
  '/api/tokens/generate',
  '/api/issues',
  '/api/chat',
  '/api/email/test',
  '/api/plans',
  '/api/plans/folders',
  '/api/settings/email',
  '/api/settings/sms',
  '/api/settings/notifications',
  '/api/settings/workflow',
  '/api/tasks',
  '/api/contractors',
  '/supabase-test',
  '/test-auth',
  '/test-auth-mock',
  '/test-people',
  '/test-simple',
  '/test-simple-page',
  '/test-profile',
  '/profile'
]

// API routes that should bypass middleware
const API_ROUTES = [
  '/api/auth',
  '/api/webhooks',
]

// Assets and static content that should bypass authentication
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/assets',
]

// Helper function to check if path is public
function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
}

// Helper function to check if path is static
function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some(path => pathname.startsWith(path))
}

// Helper function to check if path is API route
function isApiRoute(pathname: string): boolean {
  return API_ROUTES.some(route => pathname.startsWith(route))
}

// Temporarily disable all authentication checks for development
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets
  if (isStaticPath(pathname)) {
    return NextResponse.next()
  }

  // Skip middleware for API routes
  if (isApiRoute(pathname)) {
    return NextResponse.next()
  }

  // For development: Allow all requests to pass through
  // TODO: Enable proper auth checking when ready
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Future: Add proper authentication logic here
  // Example pattern for when auth is enabled:
  /*
  if (!isPublicPath(pathname)) {
    // Check authentication
    const response = NextResponse.next()
    // Add auth logic here
    return response
  }
  */

  return NextResponse.next()
}

// Configure which routes to run middleware on (Next.js 15 pattern)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|assets).*)',
  ],
} 