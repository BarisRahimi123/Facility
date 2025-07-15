# Login Issue Debug Guide

## Problem Description
The login page keeps loading indefinitely when trying to sign in.

## What We've Done

### 1. Created Debug Pages
- **`/auth/debug`** - Comprehensive system checks showing:
  - Environment variable status
  - Supabase connection
  - Session status
  - Browser information
  - Troubleshooting steps

- **`/auth/test-login`** - Test login functionality with:
  - Check current auth status
  - List of known users
  - Sign out functionality
  - Direct testing capabilities

### 2. Fixed Environment Variable Handling
Updated `src/lib/supabase/client.ts` to:
- Properly check for environment variables before using them
- Use lazy loading pattern for singleton Supabase instance
- Add better error messages when env vars are missing

### 3. Verified System Status
- ✅ Environment variables are loaded correctly
- ✅ Next.js development server is running
- ✅ Supabase connection is working
- ✅ Database has 7 users including master admin (85baris@gmail.com)
- ⚠️  Some email mismatches between auth and database users

## Known Users in Database

| Email | Role | Status |
|-------|------|--------|
| 85baris@gmail.com | master_admin | Active |
| inub.baris@gmail.com | renter | Active |
| test@example.com | renter | Active |
| baris@plansrow.net | staff | Active |
| inub_k@yahoo.com | manager | Active |
| rahimiabdul85@gmail.com | staff | Active |
| balwan.af@gmail.com | staff | Active |

## Troubleshooting Steps

### 1. Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Try to sign in and look for errors
4. Check Network tab for failed requests

### 2. Visit Debug Pages
1. Go to http://localhost:3000/auth/debug
2. Check all status indicators
3. Try "Clear Storage & Refresh" button
4. Note any red X marks or errors

### 3. Test Login Flow
1. Go to http://localhost:3000/auth/test-login
2. Click "Check Current Auth Status"
3. If already logged in, click "Sign Out"
4. Try signing in with one of the known users

### 4. Common Issues & Solutions

#### Issue: "Invalid login credentials"
- **Cause**: Wrong password or unverified email
- **Solution**: 
  - Check email for verification link
  - Use password reset at `/auth/reset-password`
  - Try a different user account

#### Issue: Page keeps loading
- **Cause**: JavaScript error or network issue
- **Solution**:
  - Check browser console for errors
  - Clear browser cache and cookies
  - Try incognito/private browsing mode
  - Disable browser extensions

#### Issue: "supabaseUrl is required" error
- **Cause**: Environment variables not loaded
- **Solution**:
  - Restart Next.js server: `npm run dev`
  - Verify `.env.local` file exists
  - Check file has no formatting issues

### 5. Test with cURL
Test the API directly:
```bash
curl -X POST https://ahntaamtsypranvnofxy.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "85baris@gmail.com",
    "password": "YOUR_PASSWORD"
  }'
```

## Next Steps

1. **Open browser console** and try signing in to see specific errors
2. **Visit `/auth/debug`** to check system status
3. **Try `/auth/test-login`** for simplified testing
4. **Check if you know the password** for any of the existing users
5. **Create a new account** at `/auth/sign-up` if needed

## Need More Help?

If the issue persists:
1. Share the browser console errors
2. Share the results from `/auth/debug` page
3. Try creating a new user account
4. Check Supabase dashboard for any auth settings issues

Remember: The most common cause is either wrong credentials or unverified email addresses. 