import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Paths that don't require authentication
const publicPaths = [
  '/',
  '/landing',
  '/pricing',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/reset-password',
  '/auth/update-password',
  '/auth/callback',
  '/auth/verify-email',
  '/auth/accept-invitation',
  '/auth/force-signout',
  '/sms-consent',
  '/contractor-form',
  '/report',
  '/maintenance/report',
  '/api/auth',
  '/api/test-email',
  '/api/test-sms',
  '/api/sms/consent',
  '/api/share',
  '/api/issues',
  '/api/contractors',
]

// Assets and static content that should bypass authentication
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
  '/assets',
  '/public',
  '/uploads',
  '/animations',
]

// Helper function to check if path is public
function isPublicPath(pathname: string): boolean {
  // Check exact matches and prefix matches
  return publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(path + '/') ||
    pathname.startsWith(path + '?')
  )
}

// Helper function to check if path is static
function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static assets
  if (isStaticPath(pathname)) {
    return NextResponse.next()
  }
  
  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Create response object
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get Supabase environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] Missing Supabase environment variables')
    // In production, redirect to sign-in if env vars are missing
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
    return response
  }

  // Create Supabase client with cookie handling
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  try {
    // Get the session - this will also refresh it if needed
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // Log for debugging (will be removed later)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[Middleware] Path: ${pathname}, Session: ${session ? 'Valid' : 'None'}, Error: ${error?.message || 'None'}`)
    }
    
    // If no session and trying to access protected route, redirect to sign-in
    if (!session) {
      // Protected paths that require authentication
      const protectedPaths = [
        '/facilities',
        '/facility',
        '/buildings',
        '/people',
        '/analytics',
        '/staff',
        '/maintenance',
        '/settings',
        '/profile',
        '/user-dashboard',
        '/facilities-map',
        '/admin',
      ]
      
      const isProtectedPath = protectedPaths.some(path => 
        pathname === path || pathname.startsWith(path + '/')
      )
      
      if (isProtectedPath) {
        console.log(`[Middleware] No session for protected path: ${pathname}, redirecting to sign-in`)
        const redirectUrl = new URL('/auth/sign-in', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // If session exists, refresh auth cookies in the response
    if (session) {
      // The cookies are already set in the response object via the set() method above
      // This ensures the session stays fresh
    }
    
  } catch (error) {
    console.error('[Middleware] Error checking session:', error)
    // In case of error, allow the request to continue
    // The individual pages will handle auth checks
  }

  return response
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}