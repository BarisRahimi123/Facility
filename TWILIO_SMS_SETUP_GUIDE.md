# Twilio SMS Notification Setup Guide

## Overview
FacilityCore now includes comprehensive SMS notification capabilities powered by Twilio. The system sends automatic notifications for:
- Maintenance task assignments and due dates
- Issue reports and assignments
- Reservation requests and approvals
- Contractor invitations
- Scheduled maintenance reminders

## 🚀 Quick Start

### Step 1: Get Your Twilio Credentials

1. **Sign up for Twilio**
   - Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
   - Create a free trial account (includes $15 credit)
   - Verify your email and phone number

2. **Get Your Credentials**
   - Go to [Twilio Console](https://console.twilio.com)
   - Find your **Account SID** and **Auth Token** on the dashboard
   - Save these - you'll need them for configuration

3. **Get a Phone Number**
   - In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a Number**
   - Choose a number with SMS capabilities
   - For trial accounts: You can use the provided trial number
   - Copy your Twilio phone number (format: +1234567890)

### Step 2: Configure Environment Variables

1. **Run the setup script**:
   ```bash
   node scripts/setup-twilio-env.js
   ```

2. **Update `.env.local`** with your actual credentials:
   ```env
   # Twilio SMS Configuration
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Optional: For production URL in SMS links
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

### Step 3: Test SMS Functionality

1. **Check configuration status**:
   ```bash
   curl http://localhost:3000/api/test-sms
   ```

2. **Send a test SMS** (replace with your phone number):
   ```bash
   curl -X POST http://localhost:3000/api/test-sms \
     -H "Content-Type: application/json" \
     -d '{"to": "+1234567890"}'
   ```

## 📱 SMS Notification Types

### 1. Issue & Task Notifications
- **Issue Submitted**: When a new issue is reported
- **Issue Assigned**: When an issue is assigned to a staff member
- **Issue Resolved**: When an issue is marked as complete

### 2. Due Date Reminders
- **Task Due Tomorrow**: Sent at 9 AM the day before
- **Task Due Today**: Sent at 8 AM on the due date
- **Task Overdue**: Sent at 9 AM for overdue tasks

### 3. Reservation Notifications
- **Reservation Requested**: Sent to facility managers
- **Reservation Approved**: Sent to requester
- **Reservation Rejected**: Sent to requester with reason
- **Reservation Reminder**: Sent day before reservation

### 4. Maintenance Notifications
- **Maintenance Scheduled**: Sent to all facility users
- **Contractor Invited**: Sent to contractors with submission link

## 🔧 Integration Points

### Automatic SMS Triggers

1. **When an issue is reported** (`src/app/actions/maintenanceIssues.ts`):
   - Notifies facility managers with issue details
   - Includes priority level and facility/building info

2. **When a task is assigned** (`src/app/actions/maintenance.ts`):
   - Notifies assigned staff members
   - Includes due date and task details

3. **When a reservation is made** (integrate in reservation actions):
   - Notifies approvers for new requests
   - Notifies requesters of status changes

### Manual SMS Sending

Use the SMS service directly in your code:

```typescript
import { sendSMS } from '@/lib/sms';

// Send a single SMS
await sendSMS(
  '+1234567890',
  'issue_assigned',
  {
    facilityName: 'Main Building',
    issueTitle: 'AC not working',
    dueDate: 'Today',
    link: 'https://app.facilitycore.com/maintenance'
  }
);

// Send batch SMS
import { sendBatchSMS } from '@/lib/sms';

await sendBatchSMS(
  [
    { phone: '+1234567890', variables: { name: 'John' } },
    { phone: '+0987654321', variables: { name: 'Jane' } }
  ],
  'maintenance_scheduled',
  { facilityName: 'Building A', date: 'Tomorrow' }
);
```

## ⚙️ User Notification Preferences

Users can manage their SMS preferences through the API:

### Get Preferences
```bash
curl http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Update Preferences
```bash
curl -X POST http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "sms_enabled": true,
    "sms_notifications": {
      "issue_assigned": true,
      "task_due_today": true,
      "task_overdue": true,
      "reservation_approved": true
    }
  }'
```

## 🕐 Scheduled Reminders

### Setting Up Daily Reminders

The system includes a cron endpoint for daily reminders: `/api/cron/daily-reminders`

#### Option 1: Vercel Cron Jobs (Recommended for Production)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

#### Option 2: GitHub Actions

Create `.github/workflows/daily-reminders.yml`:
```yaml
name: Daily SMS Reminders
on:
  schedule:
    - cron: '0 9 * * *'
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Daily Reminders
        run: |
          curl -X POST https://your-app.com/api/cron/daily-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option 3: External Cron Service

Use services like [cron-job.org](https://cron-job.org) to call:
```
POST https://your-app.com/api/cron/daily-reminders
Headers: Authorization: Bearer YOUR_CRON_SECRET
```

## 📊 Monitoring & Debugging

### Check SMS Logs

All SMS attempts are logged to the console. Look for:
- `✅ SMS sent successfully to +1234567890` - Success
- `📱 SMS notification (Twilio not configured)` - Config missing
- `❌ Error sending SMS:` - Send failure

### Common Issues & Solutions

1. **"Twilio not configured" error**
   - Ensure all three environment variables are set
   - Restart your development server after adding env vars

2. **"Invalid phone number" error**
   - Phone numbers must be in E.164 format (+1234567890)
   - US numbers: 10 digits (area code + number)
   - International: Include country code

3. **Trial Account Limitations**
   - Can only send to verified phone numbers
   - Add numbers in Twilio Console → Phone Numbers → Verified Caller IDs
   - Upgrade to paid account to remove restrictions

4. **SMS not received**
   - Check Twilio Console → Monitor → Logs for delivery status
   - Verify recipient's phone can receive SMS
   - Check if number is on carrier's spam list

## 💰 Pricing & Limits

### Twilio Pricing (as of 2024)
- **SMS to US/Canada**: ~$0.0079 per message
- **Phone Number**: $1.15/month (US local)
- **No setup fees or minimum commitment**

### Rate Limits
- Trial: 1 message per second
- Upgraded: 10+ messages per second
- Built-in delays in batch sending to prevent throttling

## 🔒 Security Best Practices

1. **Never commit credentials**
   - Keep `.env.local` in `.gitignore`
   - Use environment variables in production

2. **Validate phone numbers**
   - Always validate format before sending
   - Use the built-in `isValidPhoneNumber()` function

3. **Implement rate limiting**
   - Add rate limiting to prevent SMS spam
   - Track SMS usage per user

4. **Use opt-in/opt-out**
   - Respect user preferences
   - Include unsubscribe instructions for marketing messages

## 📝 Database Schema Updates

The SMS system uses the following database fields:

### Users Table
```sql
-- Add if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "sms_enabled": true,
  "email_enabled": true,
  "sms_notifications": {
    "issue_assigned": true,
    "task_due_today": true,
    "task_overdue": true,
    "reservation_approved": true
  }
}';
```

## 🚀 Production Deployment

### Required Environment Variables
```env
# Twilio (Required)
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_PHONE_NUMBER=your_twilio_number

# App URL (Required for SMS links)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Cron Secret (Optional but recommended)
CRON_SECRET=random_secure_string_here
```

### Upgrade Twilio Account
1. Add payment method in Twilio Console
2. Remove trial restrictions
3. Consider getting a toll-free number for better deliverability
4. Set up a Messaging Service for advanced features

## 📧 Support

For issues or questions:
1. Check Twilio Console logs
2. Review this guide
3. Check console logs in your application
4. Contact Twilio support for account issues

---

**Next Steps:**
1. ✅ Set up Twilio credentials
2. ✅ Test SMS sending
3. ✅ Configure user preferences
4. ✅ Set up daily reminders
5. ✅ Deploy to production

