# Logout Fix

## Problem
After implementing session persistence with long-lasting cookies (7 days), the logout functionality wasn't working properly. Users would click logout but remain authenticated when refreshing or navigating.

## Root Cause
The session persistence implementation uses `httpOnly` cookies with a 7-day `maxAge`. When users logout, these persistent cookies weren't being properly cleared, causing the session to persist even after calling `supabase.auth.signOut()`.

## Solution

### 1. Enhanced Client-Side Logout
Updated both `Sidebar.tsx` and `TopBar.tsx` to:
- Clear `localStorage` and `sessionStorage` before signing out
- Call a server-side logout API to clear httpOnly cookies
- Use cache-busting redirects with timestamps
- Handle errors gracefully with fallback clearing

### 2. Server-Side Logout API
Created `/api/auth/signout` endpoint that:
- Calls `supabase.auth.signOut()` on the server
- Explicitly clears all possible Supabase auth cookies
- Sets cookie expiration to past date (`new Date(0)`)
- Handles various cookie naming patterns

### 3. Comprehensive Cookie Clearing
The server-side logout clears these cookies:
- `sb-access-token`
- `sb-refresh-token`
- `supabase-auth-token`
- `supabase.auth.token`
- `sb-auth-token`
- Plus domain-specific variants

## Implementation Details

### Client-Side Flow
1. Clear browser storage (`localStorage`, `sessionStorage`)
2. Call server-side logout API to clear httpOnly cookies
3. Call client-side `supabase.auth.signOut()`
4. Redirect with cache-busting timestamp
5. Handle errors with forced clearing and redirect

### Server-Side API
```typescript
export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  
  // Clear all auth cookies with explicit expiration
  const response = NextResponse.json({ success: true });
  cookiesToClear.forEach(cookieName => {
    response.cookies.set({
      name: cookieName,
      value: '',
      expires: new Date(0), // Past date
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    });
  });
  
  return response;
}
```

## Testing
1. Sign in to the application
2. Click "Sign Out" button (in sidebar or user menu)
3. Verify redirect to sign-in page
4. Refresh the browser - should remain on sign-in page
5. Try navigating back - should not be authenticated

## Notes
- The fix maintains session persistence for normal usage
- Only clears cookies when user explicitly logs out
- Handles network failures gracefully
- Works with both sidebar and topbar logout buttons 