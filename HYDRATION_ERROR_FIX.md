# Browser Extension Hydration Error Fix

## Problem
Browser extensions (like LastPass, 1Password, Grammarly) inject DOM elements into pages after React hydrates, causing hydration mismatches in Next.js applications.

Common error:
```
Hydration failed because the server rendered HTML didn't match the client.
- <div data-lastpass-icon-root="" style={{position:"relative",height:"0px",width:"0px",float:"left"}}>
```

## Solution
Use the NoSSR (No Server-Side Rendering) pattern for authentication forms and other pages where browser extensions commonly inject elements.

### Implementation

1. **Split your page component:**
```tsx
// Before
export default function SignInPage() {
  // Form logic here
  return <form>...</form>;
}

// After
function SignInForm() {
  // Form logic here
  return <form>...</form>;
}

export default function SignInPage() {
  return (
    <NoSSR fallback={<AuthLoadingSkeleton />}>
      <SignInForm />
    </NoSSR>
  );
}
```

2. **Components used:**
- `NoSSR` - Renders children only on client side
- `AuthLoadingSkeleton` - Loading UI shown during SSR

3. **Files to import:**
```tsx
import { NoSSR } from '@/components/ui/no-ssr';
import { AuthLoadingSkeleton } from '@/components/ui/auth-loading-skeleton';
```

## Applied to:
- ✅ Sign-in page (`src/app/auth/sign-in/page.tsx`)
- ✅ Sign-up page (`src/app/auth/sign-up/page.tsx`)

## Consider applying to:
- Reset password page
- Update password page
- Any other forms where password managers inject elements

## Benefits
- Prevents hydration errors from browser extensions
- Maintains SSR benefits for SEO and initial load
- Provides smooth loading experience
- Works with all browser extensions, not just password managers 