# Email Verification Troubleshooting Guide

## Problem
User signed up but didn't receive the email verification email.

## Root Cause
This is a common issue with Supabase's default email configuration, especially in development environments.

## Quick Solutions (Try These First)

### 1. 🔄 Resend Verification Email
- Click the "Resend verification email" button on the verification page
- Wait 5-10 minutes (Supabase's default SMTP can be slow)

### 2. 📫 Check Email Folders
- **Spam/Junk folder** - Most common location
- **Promotions tab** (Gmail)
- **Updates tab** (Gmail)
- **All Mail** folder

### 3. 🔍 Try Different Email Provider
- Gmail, Yahoo, Outlook tend to work better than custom domains
- Avoid temporary email services

## Development Solutions

### Option A: Disable Email Verification (Fastest)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/auth/users)
2. Navigate to: **Authentication → Settings**
3. Scroll down to "**Email confirmation**" section
4. Toggle **OFF** "Enable email confirmations"
5. Save changes
6. ⚠️ **Important**: Re-enable for production!

### Option B: Manual User Verification
1. Go to [Supabase Dashboard → Users](https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/auth/users)
2. Find the user: `bid4wgcc@gmail.com`
3. Click on the user
4. Manually verify the email address

### Option C: Check Supabase Email Settings
1. Go to: **Authentication → Settings → Email**
2. Verify these settings:
   - ✅ "Enable email confirmations" is ON
   - ✅ "Site URL" includes: `http://localhost:3000`
   - ✅ "Redirect URLs" includes: `http://localhost:3000/**`

## Production Solutions

### 1. Configure Custom SMTP Provider
For production, configure a reliable email service:

**Recommended providers:**
- SendGrid
- Mailgun  
- AWS SES
- Postmark

**Setup in Supabase:**
1. Go to: **Authentication → Settings → SMTP Settings**
2. Enable "Enable custom SMTP"
3. Enter your provider's SMTP credentials

### 2. Use Custom Email Templates
The project includes branded email templates in `/email-templates/`:
- `confirm-signup.html`
- `reset-password.html` 
- `user-invitation.html`

**To apply:**
1. Go to: **Authentication → Email Templates**
2. Update each template with the HTML content
3. Test with a real email address

## Testing Email Verification

Run the diagnostic script:
```bash
node scripts/test-email-verification.mjs
```

This will check:
- ✅ Supabase connection
- ✅ Environment variables
- ✅ Configuration status

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **No email received** | Check spam, wait 10 minutes, try different email |
| **Email in spam** | Configure custom SMTP with good reputation |
| **Slow delivery** | Use custom SMTP provider (SendGrid, Mailgun) |
| **Invalid template** | Check email template formatting |
| **Wrong redirect URL** | Update Site URL in Supabase settings |

## Immediate Action Plan

**For User `bid4wgcc@gmail.com`:**

1. **Quick Fix** (1 minute):
   - Disable email verification temporarily
   - User can sign in immediately

2. **Manual Verification** (2 minutes):
   - Go to Supabase Dashboard → Users
   - Find and manually verify the user

3. **Resend Email** (5-10 minutes):
   - Click "Resend verification email"
   - Check spam folder after 10 minutes

## Project-Specific Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy
- **Authentication Users**: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/auth/users
- **Email Settings**: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/auth/settings
- **Email Templates**: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/auth/templates

## Prevention for Future

1. **Set up custom SMTP** for reliable email delivery
2. **Test email verification** with multiple email providers
3. **Add email fallback** options in the app
4. **Monitor email delivery** rates and bounce rates
5. **Consider SMS verification** as backup option

---

**Need immediate help?** 
Disable email verification in Supabase Dashboard → Authentication → Settings → Toggle OFF "Enable email confirmations" 