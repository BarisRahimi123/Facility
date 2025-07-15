# Authentication Persistence Guide

## Overview
This guide ensures users remain signed in when clicking the FacilityCore logo or refreshing the website.

## Implementation Details

### 1. Session Persistence Configuration ✅
The Supabase client is already configured with proper session persistence:

```typescript
// src/lib/supabase/client.ts
auth: {
  flowType: 'pkce',
  detectSessionInUrl: true,
  persistSession: true,        // Sessions are persisted in localStorage
  autoRefreshToken: true,      // Tokens are automatically refreshed
  storage: {
    // Custom storage adapter for Safari compatibility
    // Falls back to sessionStorage if localStorage fails
  }
}
```

### 2. Logo Link Update ✅
Updated the Sidebar logo to redirect to `/facilities-map` instead of landing page when user is logged in:

```typescript
// src/components/layout/Sidebar.tsx
<Link href={user ? "/facilities-map" : "/"} className="flex items-center gap-3 group">
```

### 3. Middleware Session Refresh ✅
The middleware automatically refreshes sessions on each request:

```typescript
// src/middleware.ts
// This will refresh the session if it exists
const { data: { session } } = await supabase.auth.getSession();
```

### 4. Auth State Listeners ✅
Components listen for auth state changes:

```typescript
// src/contexts/AuthContext.tsx
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await refreshUser();
  } else if (event === 'TOKEN_REFRESHED') {
    await refreshUser();
  }
});
```

## How It Works

1. **Initial Sign In**: When users sign in, Supabase stores the session in localStorage
2. **Page Refresh**: On refresh, the session is automatically restored from localStorage
3. **Token Refresh**: Tokens are automatically refreshed before expiry
4. **Logo Click**: Clicking the logo now keeps signed-in users on the facilities map

## Session Duration

By default, Supabase sessions last:
- Access tokens: 1 hour (auto-refreshed)
- Refresh tokens: 1 week

To extend session duration, configure in Supabase Dashboard:
1. Go to Authentication → Settings
2. Adjust JWT expiry time
3. Adjust refresh token expiry

## Testing

1. Sign in to the application
2. Click the FacilityCore logo - should stay on `/facilities-map`
3. Refresh the page - should remain signed in
4. Close and reopen browser - should remain signed in (unless in private mode)

## Troubleshooting

### User Gets Signed Out on Refresh
1. Check browser console for errors
2. Verify localStorage is not blocked
3. Check if using private/incognito mode (sessions won't persist)

### Safari Issues
The client includes Safari-specific fallbacks to sessionStorage if localStorage fails.

### Session Expired
If refresh token expires (after 1 week by default), users must sign in again.

## Security Notes

- Sessions are stored securely in httpOnly cookies on the server
- Client-side storage uses localStorage with proper encryption
- Refresh tokens are rotated on use for security 