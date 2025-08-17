# Quick Twilio SMS Setup Guide

## ✅ Issues Fixed

The notification settings error has been fixed! The issues were:
1. API routes were looking for wrong environment variable names (with `NEXT_PUBLIC_` prefix)
2. Test SMS route had a hardcoded phone number
3. Missing proper handling of credentials

## 🚀 Two Ways to Configure Twilio SMS

### Option 1: Through the Settings UI (Easiest)

1. **Go to Settings → Notifications** in your app
2. **Turn on SMS Configuration** toggle
3. **Enter your Twilio credentials**:
   - Account SID (starts with `AC...`)
   - Auth Token
   - Phone Number (with country code, e.g., `+14155552671`)
4. **Click "Save SMS Settings"**
5. **Test it**: Enter your phone number and click "Send Test"

> **Note**: Settings entered through the UI are temporary and will be lost when the server restarts. For permanent configuration, use Option 2.

### Option 2: Environment Variables (Permanent)

Add these to your `.env.local` file:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155552671

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then restart your development server: `npm run dev`

## 📱 Getting Your Twilio Credentials

1. **Sign up for Twilio**: https://www.twilio.com/try-twilio
   - You get $15 free credit (about 1,900 SMS messages)

2. **Get your credentials from the Console**:
   - **Account SID**: On the main dashboard (starts with `AC`)
   - **Auth Token**: Click "Show" on the dashboard
   - **Phone Number**: Go to Phone Numbers → Buy a Number (or use trial number)

3. **For trial accounts**:
   - You can only send to verified numbers
   - Add test numbers: Phone Numbers → Verified Caller IDs
   - Each SMS will say "Sent from your Twilio trial account"

## 🧪 Testing Your Setup

### Through the UI:
1. Go to Settings → Notifications
2. Enable SMS Configuration
3. Enter a test phone number
4. Click "Send Test"

### Via API:
```bash
# Check if Twilio is configured
curl http://localhost:3000/api/test-sms

# Send a test SMS
curl -X POST http://localhost:3000/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890"}'
```

## 🔔 What Gets SMS Notifications

Once configured, SMS notifications are automatically sent for:

- **Issue Reports**: Facility managers notified
- **Task Assignments**: Staff notified when assigned
- **Due Date Reminders**: 
  - Tomorrow: 9 AM reminder
  - Today: 8 AM urgent reminder
- **Contractor Invitations**: Link to accept tasks
- **Reservations**: Request and approval notifications

## ❓ Troubleshooting

### "Twilio configuration is incomplete"
- Make sure all three values are set (Account SID, Auth Token, Phone Number)
- Check that Account SID starts with `AC`
- Ensure phone number includes country code (+1 for US)

### "Invalid Account SID format"
- Account SID must start with `AC`
- It should be 34 characters long

### SMS not sending to my number
- For trial accounts, verify your number in Twilio Console
- Go to Phone Numbers → Verified Caller IDs → Add number

### Settings reset after server restart
- Use environment variables (Option 2) for permanent configuration
- UI settings are temporary and stored in memory

## 🎉 That's It!

Your SMS notifications are now configured. The system will automatically send notifications based on user preferences and phone numbers in their profiles.
