# Room Creation "Failed to fetch" Error Fix

## Issue
When trying to add rooms (including Restroom), users were getting "Failed to fetch" errors due to server action failing with "Supabase client not initialized".

## Root Cause
The `buildings.ts` server action was using its own `getServiceRoleClient` function that:
- Returned `null` when environment variables weren't found
- Didn't properly handle Next.js server-side environment variable loading
- Conflicted with the proper implementation in `@/lib/supabase/server`

## Solution Applied
1. Updated imports to use the proper `getServiceRoleClient` from `@/lib/supabase/server`
2. Removed the local `getServiceRoleClient` implementation
3. Removed null checks since the proper version throws descriptive errors

## Code Changes
```typescript
// Before
import { createServerSupabaseClient } from '@/lib/supabase/server';

const getServiceRoleClient = () => {
  // Local implementation that returned null
};

// After
import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';
// No local implementation - uses the proper server version
```

## Testing
1. Restart Next.js development server
2. Clear browser cache
3. Try creating any room type (Classroom, Restroom, etc.)
4. Room should be created successfully

## Key Lesson
Always use the centralized Supabase client creation functions from `@/lib/supabase/server` for server actions instead of creating custom implementations. This ensures proper environment variable handling and error reporting. 