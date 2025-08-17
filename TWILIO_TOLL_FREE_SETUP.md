# Twilio Toll-Free Number Setup Guide

## 🚀 Quick Fix for "Unregistered Number" Error

Your current number (+1 8582392011) needs A2P 10DLC registration. The fastest solution is to get a toll-free number.

## Step 1: Buy a Toll-Free Number

1. **Go to Twilio Console**: https://console.twilio.com
2. **Navigate to**: Phone Numbers → Manage → Buy a Number
3. **Filter by**: 
   - Country: United States
   - Type: **Toll-Free** (important!)
   - Capabilities: SMS ✓
4. **Choose a number** (will start with 833, 844, 855, 866, 877, or 888)
5. **Purchase** (usually $2/month)

## Step 2: Update Your Configuration

Replace your old number with the new toll-free number:

### In Settings:
1. Go to Settings → Notifications → SMS Configuration
2. Update **Twilio Phone Number** to your new toll-free number
3. Format: `+18331234567` (example)
4. Save

### In .env.local:
```env
TWILIO_PHONE_NUMBER=+18331234567  # Your new toll-free number
```

## Step 3: Submit for Toll-Free Verification

1. **Go to**: Twilio Console → Messaging → Regulatory Compliance → Toll-Free Verification
2. **Click**: "Create New Toll-Free Verification"
3. **Fill out the form**:

### Business Information:
- **Business Name**: FacilityCore (or your company)
- **Business Website**: https://facilitycore.ai
- **Business Type**: Software/Technology

### Use Case:
- **Use Case Category**: Notifications
- **Use Case Description**:
  ```
  Facility management notifications including:
  - Maintenance task assignments and reminders
  - Urgent facility issue alerts
  - Reservation confirmations
  - Due date reminders for maintenance tasks
  ```

### Message Samples:
Provide these examples:
```
1. 🔧 New issue reported at Main Building: "HVAC not working". Priority: High. View: [link]

2. ⏰ Reminder: Maintenance task "Replace air filters" is due tomorrow. Please complete.

3. ✅ Your reservation for Conference Room A on Jan 20 has been APPROVED. Confirmation #12345
```

### Opt-In Details:
- **Opt-In Type**: Web Form
- **Opt-In URL**: `https://facilitycore.ai/sms-consent`
  (Or use your local URL with explanation that it's in development)
- **Opt-In Description**:
  ```
  Users provide explicit consent via web form with checkbox acknowledgment. 
  The form collects phone number and displays TCPA-compliant disclosure 
  including message frequency, rates may apply, and STOP instructions.
  ```

### Volume Estimates:
- **Monthly Volume**: 1,000-5,000 messages (adjust based on your needs)
- **Daily Max**: 200 messages

## Step 4: Attach Supporting Documents

Upload these files (we already created them!):
1. **Screenshot** of your consent page (`http://localhost:3000/sms-consent`)
2. **TWILIO_SMS_CONSENT_PROOF.md** file
3. Any business registration documents (optional but helpful)

## Step 5: Submit and Wait

- Submission takes 5-10 minutes
- Approval usually within 1-3 business days
- You'll get an email when approved

## 📱 Test Your New Number Immediately

Even before verification approval, toll-free numbers usually work better than unregistered local numbers:

```bash
# Test with your new toll-free number
curl -X POST http://localhost:3000/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+15128396700"}'
```

## ⚠️ Important Notes:

1. **Keep your consent page live** - Twilio may check it
2. **Don't send marketing** until approved
3. **Transactional messages** (like the ones in your app) are usually fine
4. **Volume limits** apply until verified

## 🎯 Why Toll-Free is Better:

- ✅ Faster approval (1-3 days vs 2-7 for A2P 10DLC)
- ✅ Simpler process (one form vs multiple registrations)
- ✅ Better deliverability
- ✅ No per-campaign fees
- ✅ Professional appearance (toll-free looks more legitimate)

## 🆘 If Still Having Issues:

1. **Check SMS Geographic Permissions**:
   - Twilio Console → Messaging → Settings → Geo Permissions
   - Make sure United States is enabled

2. **Check Messaging Service** (optional):
   - Consider creating a Messaging Service
   - Twilio Console → Messaging → Services → Create
   - Add your toll-free number to it

3. **For Testing Only**:
   - Add recipient numbers to Verified Caller IDs
   - This bypasses all registration requirements for testing

---

**Timeline**: You should be able to send messages with your toll-free number in 1-3 business days!
