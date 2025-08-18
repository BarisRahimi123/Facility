# Production Setup Guide - Complete Fix

## Current Issues
1. ❌ Authentication failing (401 Unauthorized)
2. ❌ Environment variables still corrupted
3. ❌ Users table needs proper setup
4. ❌ People page can't connect to database

## Step-by-Step Production Fix

### Step 1: Get Fresh Supabase Credentials
1. Go to https://supabase.com/dashboard
2. Select your project: `ahntaamtsypranvnofxy`
3. Go to **Settings** → **API**
4. Copy these values (make sure they're complete):

```
Project URL: https://ahntaamtsypranvnofxy.supabase.co
anon public: eyJ... (starts with eyJ, very long)
service_role: eyJ... (starts with eyJ, very long, different from anon)
```

### Step 2: Fix Environment Variables
Create a new `.env.local` file with EXACTLY these values (no line breaks in keys):

```bash
# Replace YOUR_ANON_KEY and YOUR_SERVICE_KEY with the actual values from Step 1
NEXT_PUBLIC_SUPABASE_URL=https://ahntaamtsypranvnofxy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE_ON_ONE_LINE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY_HERE_ON_ONE_LINE

# SendGrid (already working)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=info@facilitycore.ai
SENDGRID_FROM_NAME=FacilityCore

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoiYmFyaXMtcmFoaW1pIiwiYSI6ImNtNGQ4eWVsODBxc3gyaXF6MDJqZzN1ZWwifQ.D_bPkLzKOTOI9IaFsVktEQ

# Development
NODE_ENV=development
```

### Step 3: Create Database Tables
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy the ENTIRE contents of `supabase/migrations/20250118_create_users_organizations.sql`
4. Paste and click **Run**

### Step 4: Restart Everything
```bash
# Stop the Next.js server (Ctrl+C)
npm run dev
```

### Step 5: Test Authentication
1. Go to http://localhost:3000
2. Try to sign in with `85baris@gmail.com`
3. Check browser console - should see no 401 errors

### Step 6: Test People Page
1. Go to People page
2. Should see user management interface (no "Database Setup Required")
3. Try sending an invitation

## Quick Verification Script
Run this to verify environment variables are working:

```bash
node -e "
require('dotenv').config({path: '.env.local'});
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('Anon Key Length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0);
console.log('Service Key Length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
console.log('SendGrid:', process.env.SENDGRID_API_KEY ? '✅' : '❌');
"
```

Expected output:
```
URL: ✅
Anon Key Length: 208
Service Key Length: 219  
SendGrid: ✅
```

## Success Indicators
✅ No 401 Unauthorized errors in console
✅ Authentication works (can sign in)
✅ People page loads without "Database Setup Required"
✅ Can send invitations and receive emails
✅ All tabs in People page work (Staff, Manager, etc.)

## If Still Having Issues
1. **Check Supabase keys are EXACTLY as shown in dashboard**
2. **Ensure no line breaks in JWT tokens**
3. **Restart browser to clear auth cache**
4. **Check Supabase project is active and not paused**

The root issue is authentication failure due to corrupted environment variables. Once we fix that, everything else will work!
