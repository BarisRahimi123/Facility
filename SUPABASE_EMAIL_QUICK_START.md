# 🚀 Quick Start: Style Your Supabase Emails

## Step-by-Step Instructions

### 1. Access Email Templates
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** (lock icon) → **Email Templates**

### 2. Update Confirmation Email

1. Click on **Confirm signup**
2. Update the **Subject** to:
   ```
   Welcome to Facilitycore - Please Confirm Your Email
   ```
3. Replace the **Message** with the contents of:
   ```
   email-templates/confirm-signup.html
   ```
4. Click **Save**

### 3. Update Reset Password Email

1. Click on **Reset Password**
2. Update the **Subject** to:
   ```
   Reset Your Facilitycore Password
   ```
3. Replace the **Message** with the contents of:
   ```
   email-templates/reset-password.html
   ```
4. Click **Save**

### 4. Update Invitation Email (if using custom)

For the invitation system, you'll need to send custom emails from your application. The template is provided in:
```
email-templates/user-invitation.html
```

### 5. Test Your Emails

1. Create a test account to trigger the confirmation email
2. Use "Forgot Password" to test the reset email
3. Check emails render correctly in your inbox

## 🎨 Customization Options

### Add Your Logo
Replace the text "Facilitycore" in the header with your logo:
```html
<img src="https://yoursite.com/logo.png" alt="Facilitycore" style="height: 40px;">
```

### Change Brand Colors
Update the gradient colors in the header:
```html
<!-- Current Blue Gradient -->
background: linear-gradient(135deg, #007aff 0%, #0051cc 100%);

<!-- Example: Purple Gradient -->
background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);

<!-- Example: Green Gradient -->
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

### Update Footer Links
Replace placeholder links with your actual URLs:
```html
<a href="https://help.facilitycore.com" style="...">Help Center</a>
<a href="https://support.facilitycore.com" style="...">Contact Support</a>
```

## 🚨 Important Notes

1. **Email Sending Limits**: Free Supabase projects have email limits. Consider upgrading or using custom SMTP for production.

2. **Template Variables**: Don't change these placeholders:
   - `{{ .ConfirmationURL }}` - The confirmation/reset link
   - `{{ .Email }}` - User's email address
   - `{{ .Token }}` - Security token

3. **Testing**: Always test on multiple email clients:
   - Gmail
   - Outlook
   - Apple Mail
   - Mobile devices

## 📧 Custom SMTP (Recommended for Production)

For better deliverability and no sending limits:

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure with your email service:

**SendGrid Example:**
- Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey`
- Pass: `your-sendgrid-api-key`
- Sender email: `noreply@facilitycore.com`
- Sender name: `Facilitycore`

**Other Providers:**
- Mailgun: `smtp.mailgun.org`
- AWS SES: `email-smtp.region.amazonaws.com`
- Postmark: `smtp.postmarkapp.com`

## 🎯 Next Steps

1. ✅ Update all email templates
2. ✅ Test with real email addresses
3. ✅ Set up custom SMTP for production
4. ✅ Monitor email delivery rates
5. ✅ Create additional transactional emails as needed

Need help? Check the [EMAIL_TEMPLATE_SETUP.md](./EMAIL_TEMPLATE_SETUP.md) for detailed documentation. 