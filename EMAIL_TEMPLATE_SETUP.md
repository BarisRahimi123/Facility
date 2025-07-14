# Facilitycore Email Template Setup Guide

## 📧 Custom Email Confirmation Template

### Step 1: Access Supabase Email Templates

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Find the **Confirm signup** template

### Step 2: Update Email Template

Replace the default template with this custom HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Facilitycore Account</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 48px 40px 32px; background: linear-gradient(135deg, #007aff 0%, #0051cc 100%); border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                Facilitycore
                            </h1>
                            <p style="margin: 8px 0 0; color: #e0e7ff; font-size: 16px;">
                                Facility Management Made Simple
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <!-- Welcome Icon -->
                            <div style="text-align: center; margin-bottom: 32px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #e0e7ff 0%, #cdd7ff 100%); border-radius: 50%; position: relative;">
                                    <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px;">✉️</span>
                                </div>
                            </div>
                            
                            <!-- Main Content -->
                            <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 28px; font-weight: 700; text-align: center;">
                                Confirm Your Email Address
                            </h2>
                            
                            <p style="margin: 0 0 32px; color: #6b7280; font-size: 16px; line-height: 24px; text-align: center;">
                                Welcome to Facilitycore! We're excited to have you on board. Please confirm your email address to complete your registration and access all features.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #007aff 0%, #0051cc 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);">
                                            Confirm My Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 32px 0 0; color: #9ca3af; font-size: 14px; text-align: center;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 8px 0 0; word-break: break-all; color: #6b7280; font-size: 12px; text-align: center; background-color: #f9fafb; padding: 12px 16px; border-radius: 6px;">
                                {{ .ConfirmationURL }}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Features Section -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 32px;">
                                <h3 style="margin: 0 0 24px; color: #1f2937; font-size: 20px; font-weight: 600; text-align: center;">
                                    What You Can Do With Facilitycore
                                </h3>
                                
                                <!-- Feature List -->
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #10b981; font-size: 18px;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 12px;">
                                                        <p style="margin: 0; color: #4b5563; font-size: 15px;">
                                                            Manage facilities, buildings, and rooms
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #10b981; font-size: 18px;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 12px;">
                                                        <p style="margin: 0; color: #4b5563; font-size: 15px;">
                                                            Schedule and track reservations
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #10b981; font-size: 18px;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 12px;">
                                                        <p style="margin: 0; color: #4b5563; font-size: 15px;">
                                                            Handle maintenance requests
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 12px 0;">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="width: 24px; vertical-align: top;">
                                                        <span style="color: #10b981; font-size: 18px;">✓</span>
                                                    </td>
                                                    <td style="padding-left: 12px;">
                                                        <p style="margin: 0; color: #4b5563; font-size: 15px;">
                                                            Access analytics and reports
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                                            This confirmation link will expire in 24 hours.
                                        </p>
                                        <p style="margin: 0 0 16px; color: #9ca3af; font-size: 13px;">
                                            If you didn't create an account with Facilitycore, you can safely ignore this email.
                                        </p>
                                        
                                        <!-- Social Links -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px auto 0;">
                                            <tr>
                                                <td style="padding: 0 8px;">
                                                    <a href="#" style="color: #007aff; text-decoration: none; font-size: 14px;">Help Center</a>
                                                </td>
                                                <td style="color: #e5e7eb;">|</td>
                                                <td style="padding: 0 8px;">
                                                    <a href="#" style="color: #007aff; text-decoration: none; font-size: 14px;">Contact Support</a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
                                            © 2025 Facilitycore. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### Step 3: Update Subject Line

In the same template settings, update the **Subject** field to:
```
Welcome to Facilitycore - Please Confirm Your Email
```

### Step 4: Configure Other Email Templates

Apply similar styling to other email templates:

#### Reset Password Email
**Subject**: `Reset Your Facilitycore Password`

Use the same HTML structure but update:
- Main heading to "Reset Your Password"
- Description to explain password reset
- Button text to "Reset Password"
- Button link to `{{ .ConfirmationURL }}`

#### Magic Link Email
**Subject**: `Your Facilitycore Login Link`

Update content for magic link login with appropriate messaging.

### Step 5: Email Settings

1. Go to **Authentication** → **Providers** → **Email**
2. Ensure these settings:
   - **Enable Email provider**: ON
   - **Confirm email**: ON (for security)
   - **Secure email change**: ON
   - **Secure password change**: ON

### Step 6: Custom SMTP (Optional)

For better deliverability and branding:

1. Go to **Project Settings** → **Auth**
2. Under **SMTP Settings**, configure:
   - **Host**: Your SMTP host (e.g., smtp.sendgrid.net)
   - **Port**: 587 (or your provider's port)
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: noreply@facilitycore.com
   - **Sender name**: Facilitycore

### Testing

1. Create a test account to trigger the confirmation email
2. Check that the email renders correctly
3. Verify the confirmation link works
4. Test on different email clients (Gmail, Outlook, Apple Mail)

### Email Best Practices

1. **Keep it responsive**: The template uses table-based layout for compatibility
2. **Test thoroughly**: Check rendering in different email clients
3. **Include alt text**: For better accessibility
4. **Keep file size small**: Avoid large images
5. **Use web-safe fonts**: For consistent rendering
6. **Include plain text version**: For better deliverability

### Troubleshooting

If emails aren't sending:
1. Check Supabase email logs in the dashboard
2. Verify email provider is enabled
3. Check spam folders
4. Consider using custom SMTP for better delivery
5. Ensure your Supabase project is on a paid plan for production email sending

### Additional Customization

You can further customize by:
- Adding your logo (host it publicly and use `<img>` tag)
- Matching your brand colors
- Adding more personalization with template variables
- Including helpful links to documentation 