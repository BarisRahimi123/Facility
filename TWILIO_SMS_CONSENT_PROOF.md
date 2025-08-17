# Twilio SMS Consent Documentation for A2P 10DLC / Toll-Free Verification

## 🔗 Consent Collection URL

**Primary Consent Form URL:**
```
https://facilitycore.ai/sms-consent
```

**Local Development URL:**
```
http://localhost:3000/sms-consent
```

## 📋 What Twilio Requires for Verification

### 1. **Proof of Consent URL**
✅ **Provided**: `https://facilitycore.ai/sms-consent`

This page includes:
- Clear opt-in language
- Purpose of SMS messages
- Message frequency disclosure
- "Message and data rates may apply" disclaimer
- STOP/HELP instructions
- Links to Privacy Policy and Terms of Service

### 2. **Consent Collection Method**
✅ **Implemented**: Web form with explicit checkbox consent

The form collects:
- Phone number (required)
- Full name (optional)
- Email address (optional)
- Message type preferences
- Explicit consent checkbox (required)
- IP address and timestamp (automatically captured)

### 3. **Consent Language**
✅ **Exact Text Displayed**:
```
I agree to receive automated SMS messages from FacilityCore at the phone number provided. 
I understand that consent is not a condition of purchase, message and data rates may apply, 
message frequency varies, and I can reply STOP to unsubscribe at any time.
```

### 4. **Opt-Out Instructions**
✅ **Clear Instructions Provided**:
- Reply STOP to any message to unsubscribe
- Reply HELP for assistance
- Support email: support@facilitycore.ai

### 5. **Data Storage & Records**
✅ **Complete Audit Trail**:

We maintain comprehensive records in our database including:
- Consent timestamp
- IP address
- User agent
- Page URL where consent was collected
- Exact consent text shown
- Verification status
- Opt-in/opt-out history

## 📊 Database Schema for Compliance

### Tables Created:
1. **sms_consent_records** - Stores all consent records
2. **sms_consent_history** - Tracks all opt-in/opt-out actions
3. **sms_message_log** - Logs all SMS messages sent
4. **sms_keywords** - Manages STOP/START keywords

### Key Fields Tracked:
- `phone_number` - The consenting phone number
- `consent_text` - Exact text shown to user
- `page_url` - Where consent was collected
- `consented_at` - Timestamp of consent
- `verified_at` - Double opt-in verification
- `ip_address` - IP of consenting user
- `user_agent` - Browser information

## 🔐 TCPA Compliance Features

### 1. **Explicit Consent Required**
- Users must check a consent checkbox
- No pre-checked boxes
- Clear, conspicuous disclosure

### 2. **Double Opt-In Process**
- Initial web form consent
- Verification SMS sent
- User must reply YES to confirm

### 3. **Message Type Control**
Users can select which types of messages to receive:
- Marketing & Promotional
- Transactional (bookings, receipts)
- Maintenance Alerts
- Task Reminders

### 4. **Keyword Support**
Implemented standard SMS keywords:
- **START, YES, UNSTOP** - Opt-in
- **STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT** - Opt-out
- **HELP, INFO** - Get support information

## 📝 Implementation Details

### Consent Collection Flow:
1. User visits `/sms-consent` page
2. Fills out form with phone number
3. Checks explicit consent checkbox
4. Submits form
5. Record created in database
6. Verification SMS sent
7. User replies YES to verify
8. Consent marked as verified

### Before Sending Any SMS:
```javascript
// Our system checks consent before every SMS
const consentCheck = await checkSMSConsent({
  userId,
  phoneNumber
});

if (!consentCheck.canSend) {
  // SMS blocked - no consent
  return { error: 'No consent for this number' };
}
```

## 📈 Reporting & Export Capabilities

### Available Reports:
1. **All Consent Records** - Export as CSV or JSON
2. **Opt-Out History** - Track all unsubscribes
3. **Message Send Log** - All SMS attempts
4. **Consent by Date Range** - Compliance reporting

### API Endpoints:
- `POST /api/sms/consent` - Create new consent
- `GET /api/sms/consent` - Retrieve consent status
- `POST /api/sms/consent/opt-out` - Process opt-out
- `GET /api/sms/consent/export` - Export records

## 🎯 Use Case Description for Twilio

**Business Type**: Facility Management Software

**Message Types**:
1. **Maintenance Alerts** - Urgent facility issues requiring immediate attention
2. **Task Assignments** - Notify staff of new maintenance tasks
3. **Due Date Reminders** - Remind staff of upcoming deadlines
4. **Reservation Confirmations** - Booking confirmations for facility spaces
5. **Contractor Invitations** - Invite contractors to bid on maintenance work

**Message Frequency**: 
- Varies based on facility activity
- Typically 2-5 messages per week for active users
- Users control frequency through preferences

**Sample Messages**:
```
🔧 New issue reported at Main Building: "HVAC not working". Priority: High. View details: [link]

⏰ Reminder: Maintenance task "Replace air filters" is due tomorrow. Please complete or reschedule.

✅ Your reservation for Conference Room A on Jan 15 has been APPROVED! Confirmation #12345
```

## 📁 Files & Code Locations

### Frontend:
- `/src/app/sms-consent/page.tsx` - Public consent page
- `/src/components/sms/SMSConsentForm.tsx` - Consent form component
- `/src/components/sms/SMSConsentDashboard.tsx` - User management dashboard

### Backend:
- `/src/app/api/sms/consent/route.ts` - Consent API endpoints
- `/src/app/actions/smsConsent.ts` - Server actions
- `/src/lib/sms.ts` - SMS service with consent checking

### Database:
- `/supabase/migrations/20250201_create_sms_consent_system.sql` - Complete schema

## ✅ Verification Checklist for Twilio

- [x] Public consent collection page
- [x] Clear opt-in language
- [x] Message frequency disclosure
- [x] "Msg & data rates may apply" text
- [x] STOP instructions
- [x] HELP instructions
- [x] Privacy Policy link
- [x] Terms of Service link
- [x] Database storage of consent
- [x] Timestamp tracking
- [x] IP address logging
- [x] Opt-out mechanism
- [x] Double opt-in verification
- [x] Consent checking before send
- [x] Message logging
- [x] Export capabilities

## 🚀 Next Steps for Twilio Submission

1. **Deploy the consent page** to production at `https://facilitycore.ai/sms-consent`
2. **Apply the database migration** to create consent tables
3. **Submit this URL to Twilio**: `https://facilitycore.ai/sms-consent`
4. **Provide this documentation** as proof of implementation
5. **Export sample consent records** if requested

---

**Contact for Verification Questions:**
- Technical Contact: dev@facilitycore.ai
- Compliance Contact: compliance@facilitycore.ai
- Support: support@facilitycore.ai