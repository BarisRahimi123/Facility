# SMS Consent System Setup Guide

## 🚀 Quick Setup

### Step 1: Apply Database Migration

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250201_create_sms_consent_system.sql`
4. Paste and execute the SQL
5. Verify tables created: `sms_consent_records`, `sms_consent_history`, `sms_message_log`, `sms_keywords`

### Step 2: Test Locally

1. Start your dev server:
```bash
npm run dev
```

2. Visit the consent page:
```
http://localhost:3000/sms-consent
```

3. Fill out the form and submit

### Step 3: Deploy to Production

1. Deploy your application with the new pages
2. Ensure the consent page is accessible at your domain
3. Test the form submission

## 📝 URLs for Twilio Verification

### What to Submit to Twilio:

**Consent Form URL:**
```
https://your-domain.com/sms-consent
```

For local testing:
```
http://localhost:3000/sms-consent
```

### Additional URLs (if requested):

**Privacy Policy:**
```
https://your-domain.com/privacy
```

**Terms of Service:**
```
https://your-domain.com/terms
```

**SMS Terms:**
```
https://your-domain.com/sms-terms
```

## 🔧 Integration Points

### 1. Add Consent Form to Your Site

The consent form can be embedded anywhere:

```jsx
import { SMSConsentForm } from '@/components/sms/SMSConsentForm';

// In your component
<SMSConsentForm 
  userId={currentUser?.id}
  userEmail={currentUser?.email}
  userName={currentUser?.name}
  source="account_signup" // or "checkout", "website_form", etc.
  onSuccess={() => {
    // Handle success
  }}
/>
```

### 2. Check Consent Before Sending SMS

The SMS service automatically checks consent:

```javascript
import { sendSMS } from '@/lib/sms';

// Consent is checked automatically
const result = await sendSMS(
  phoneNumber,
  'task_due_tomorrow',
  {
    taskTitle: 'Replace filters',
    facilityName: 'Main Building',
    dueDate: 'Jan 15'
  },
  userId // Optional but recommended
);

if (!result.success && result.consentError) {
  // User needs to grant consent first
}
```

### 3. User Consent Management

Add to user profile/settings:

```jsx
import { SMSConsentDashboard } from '@/components/sms/SMSConsentDashboard';

// In user settings page
<SMSConsentDashboard userId={currentUser.id} />
```

## 📊 Database Tables Created

### 1. `sms_consent_records`
Primary table storing all consent records with:
- Phone number
- User information
- Consent status (active/revoked/pending)
- Message type preferences
- Verification status
- Timestamps

### 2. `sms_consent_history`
Audit trail of all consent actions:
- Opt-ins
- Opt-outs
- Verifications
- Updates

### 3. `sms_message_log`
Log of all SMS messages:
- Phone number
- Message content
- Send status
- Twilio message ID
- Error messages

### 4. `sms_keywords`
SMS keyword management:
- START, STOP, HELP keywords
- Custom campaign keywords
- Response messages

## 🔐 Compliance Features

### TCPA Compliance
- ✅ Explicit consent required
- ✅ Clear disclosure of terms
- ✅ Message frequency disclosed
- ✅ "Msg & data rates may apply"
- ✅ Easy opt-out (STOP)
- ✅ Support information (HELP)

### Data Protection
- ✅ Consent records retained
- ✅ IP address logged
- ✅ Timestamp tracking
- ✅ Audit trail maintained
- ✅ Export capabilities

### Double Opt-In
- ✅ Web form submission
- ✅ Verification SMS sent
- ✅ User confirms via SMS reply

## 🧪 Testing Checklist

### Before Submitting to Twilio:

- [ ] Consent page loads correctly
- [ ] Form validates phone number
- [ ] Consent checkbox is required
- [ ] Form submission creates database record
- [ ] Verification SMS is sent (if Twilio configured)
- [ ] Consent status can be checked
- [ ] Opt-out mechanism works
- [ ] Message log is created

### Test Scenarios:

1. **New User Consent:**
   - Visit `/sms-consent`
   - Enter phone number
   - Check consent box
   - Submit form
   - Verify record in database

2. **Duplicate Prevention:**
   - Try to submit same phone number again
   - Should show error for existing consent

3. **Opt-Out:**
   - Call opt-out API endpoint
   - Verify status changes to 'revoked'
   - Verify SMS sending is blocked

## 📚 API Reference

### Create Consent
```
POST /api/sms/consent
Body: {
  phone_number: "+1234567890",
  full_name: "John Doe",
  email: "john@example.com",
  consent_source: "website_form",
  message_types: ["all"],
  consent_text: "...",
  page_url: "https://..."
}
```

### Check Consent
```
GET /api/sms/consent?phone=+1234567890
```

### Process Opt-Out
```
POST /api/sms/consent/opt-out
Body: {
  phone_number: "+1234567890"
}
```

## 🆘 Troubleshooting

### "Table does not exist" Error
- Run the migration SQL in Supabase SQL Editor
- Check for any SQL errors during execution

### Consent Form Not Submitting
- Check browser console for errors
- Verify API endpoints are deployed
- Check Supabase connection

### SMS Not Sending Despite Consent
- Verify Twilio credentials are set
- Check consent is verified (not just created)
- Look for consent check errors in logs

## 📞 Support

For implementation help:
- Review the code in `/src/components/sms/`
- Check `/src/app/api/sms/consent/` for API logic
- See `TWILIO_SMS_CONSENT_PROOF.md` for compliance details

---

**Remember**: Always test thoroughly in development before submitting to Twilio for verification!