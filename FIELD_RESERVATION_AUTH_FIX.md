# Field Reservation Authentication Error Fix

## Issue
Users were getting "Error: User not authenticated" when trying to submit field reservations, even when they were logged in.

## Root Cause
The `createFieldReservationFromCart` server action was using `getServiceRoleClient()` to check user authentication. The service role client doesn't have access to the user's authentication session (cookies), so `supabase.auth.getUser()` was failing.

## Solution Applied
Updated the function to use two different clients:
1. `createServerSupabaseClient()` - For authentication checks (has access to user cookies)
2. `getServiceRoleClient()` - For database operations (bypasses RLS)

### Code Changes
```typescript
// Before - Using service role client for auth (WRONG)
const supabase = getServiceRoleClient();
const { data: { user }, error: userError } = await supabase.auth.getUser(); // Fails!

// After - Using server client for auth, service role for DB
const authClient = await createServerSupabaseClient();
const { data: { user }, error: userError } = await authClient.auth.getUser(); // Works!

const supabase = getServiceRoleClient(); // Use for database operations
```

## Key Principle
In server actions:
- Use `createServerSupabaseClient()` when you need to check authentication
- Use `getServiceRoleClient()` when you need to bypass RLS for database operations
- Never use service role client for `auth.getUser()` - it doesn't have cookie access

## To Apply the Fix
1. Restart your Next.js development server
2. Clear browser cache/cookies
3. Try submitting a reservation again - it should work now

## Related Files
- `src/app/actions/fields.ts` - Fixed in `createFieldReservationFromCart` function
- `src/lib/supabase/server.ts` - Contains both client creation functions 