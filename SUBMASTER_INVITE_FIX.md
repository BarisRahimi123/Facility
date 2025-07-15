# Sub-Admin User Invitation Error Fix

## Issue
When inviting a sub-admin (submaster) user, they were getting a console error about room assignments when redirected to the staff page after login.

## Root Causes

1. **Incorrect Role Name**: The code was using 'sub_master' in some places but the actual role enum value is 'sub_admin'
2. **Wrong Redirect**: Sub-admin users were being redirected to `/staff` page which tries to fetch room assignments
3. **Poor Error Handling**: The staff page wasn't handling missing assignments gracefully

## Fixes Applied

### 1. Updated Auth Callback Redirect
```typescript
// src/app/auth/callback/route.ts
else if (userRole === 'sub_admin' || userRole === 'master_admin') {
  // Admin users go to facilities map
  return NextResponse.redirect(new URL('/facilities-map', requestUrl.origin));
}
```

### 2. Fixed Sidebar Navigation
```typescript
// src/components/layout/Sidebar.tsx
if (role === 'master_admin' || role === 'sub_admin' || role === 'district_approver' || role === 'site_approver') {
  // Show admin navigation items
}
```

### 3. Updated Role Checks
- Fixed `src/app/actions/users.ts` to check for 'sub_admin'
- Fixed `src/app/actions/staffPermissions.ts` to use 'sub_admin'
- Fixed `src/app/(app)/facilities/page.tsx` to use 'sub_admin'

### 4. Improved Error Handling
```typescript
// src/app/(app)/staff/page.tsx
if (roomAssignmentsError) {
  console.error('Error fetching room assignments:', roomAssignmentsError.message || 'Unknown error');
  // Don't fail the entire page load, just continue without room assignments
}
```

## Result

Sub-admin users will now:
1. Be redirected to `/facilities-map` after login (not `/staff`)
2. See the correct admin navigation items in the sidebar
3. Have proper access to admin features
4. Not see console errors about missing assignments

## Testing

1. Invite a new sub-admin user
2. Have them accept the invitation and set up their account
3. They should be redirected to facilities map after login
4. They should see admin navigation items in the sidebar
5. No console errors should appear 