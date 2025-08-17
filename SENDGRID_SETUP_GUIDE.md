# SendGrid Email Setup Guide

## 1. Environment Variables Setup

Add the following to your `.env.local` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE
SENDGRID_FROM_EMAIL=info@facilitycore.ai
SENDGRID_FROM_NAME=Facilitycore

# Optional: SendGrid Templates
SENDGRID_WELCOME_TEMPLATE_ID=
SENDGRID_RESET_PASSWORD_TEMPLATE_ID=
SENDGRID_INVITATION_TEMPLATE_ID=
```

## 2. Supabase Custom SMTP Configuration

### Step 1: Go to Supabase Dashboard
1. Navigate to your Supabase project dashboard
2. Go to **Settings** → **Auth**

### Step 2: Configure Custom SMTP
1. Scroll down to **SMTP Settings**
2. Toggle **Enable Custom SMTP** to ON
3. Enter the following details:

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: YOUR_SENDGRID_API_KEY_HERE
Sender email: info@facilitycore.ai
Sender name: Facilitycore
```

4. Click **Save**

### Step 3: Update Email Templates in Supabase
1. Still in **Settings** → **Auth**
2. Scroll to **Email Templates**
3. Update each template:

#### Confirmation Email Template:
- **Subject**: Welcome to Facilitycore - Please Confirm Your Email
- Use the HTML template from `email-templates/confirm-signup.html`

#### Password Reset Template:
- **Subject**: Reset Your Facilitycore Password
- Use the HTML template from `email-templates/reset-password.html`

#### Magic Link Template:
- **Subject**: Your Facilitycore Login Link
- Use a similar template structure

### Step 4: Configure Rate Limits
1. In **Settings** → **Auth**
2. Adjust **Email Rate Limit** to match SendGrid's limits
3. Recommended: 100 emails per hour for free tier

## 3. Domain Authentication (Important!)

### Why This Matters:
- Improves email deliverability
- Prevents emails from going to spam
- Required for production use

### Steps:
1. Log into SendGrid Dashboard
2. Go to **Settings** → **Sender Authentication**
3. Click **Authenticate Your Domain**
4. Follow SendGrid's wizard to add DNS records
5. Verify domain ownership

## 4. Testing the Integration

### Test Supabase Auth Emails:
1. Sign up a new user - should receive confirmation email
2. Request password reset - should receive reset email
3. Check SendGrid Activity Feed for delivery status

### Test Application Emails:
```javascript
// Test in your application
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1><p>This is a test email from Facilitycore.</p>'
});
```

## 5. Monitoring & Troubleshooting

### Check SendGrid Activity:
1. Log into SendGrid Dashboard
2. Go to **Activity Feed**
3. Check for:
   - Delivered emails
   - Bounced emails
   - Spam reports
   - Blocks

### Common Issues:

#### Emails Not Sending:
- Check API key is correct
- Verify sender email is authenticated
- Check SendGrid account isn't suspended

#### Emails Going to Spam:
- Complete domain authentication
- Add SPF/DKIM records
- Ensure content isn't triggering spam filters

#### Rate Limit Errors:
- SendGrid free tier: 100 emails/day
- Upgrade plan if needed
- Implement email queuing for bulk sends

## 6. Production Checklist

- [ ] Domain authentication completed
- [ ] SPF/DKIM records added
- [ ] Sender email verified
- [ ] Email templates tested
- [ ] Error handling implemented
- [ ] Monitoring set up
- [ ] Backup SMTP configured (optional)

## 7. SendGrid Dashboard Links

- **Dashboard**: https://app.sendgrid.com/
- **API Keys**: https://app.sendgrid.com/settings/api_keys
- **Sender Authentication**: https://app.sendgrid.com/settings/sender_auth
- **Activity Feed**: https://app.sendgrid.com/email_activity
- **Templates**: https://mc.sendgrid.com/dynamic-templates

## 8. Support

- **SendGrid Support**: https://support.sendgrid.com/
- **Supabase Docs**: https://supabase.com/docs/guides/auth/auth-smtp
- **Status Page**: https://status.sendgrid.com/
