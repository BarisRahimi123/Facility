# SendGrid Final Fix - Resolve "Forbidden" Error

## The Problem
Your SendGrid API key is working (no longer "Unauthorized") but getting "Forbidden" which means:
1. The sender email (info@facilitycore.ai) is not verified, OR
2. The API key doesn't have Full Access permissions

## Quick Fix (2 minutes)

### Option A: Use Your Personal Email (FASTEST)
1. Update `.env.local`:
   ```
   SENDGRID_FROM_EMAIL=85baris@gmail.com
   ```
2. Restart server: `npm run dev`
3. Test immediately - your personal email is likely already verified

### Option B: Verify info@facilitycore.ai
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Look for `info@facilitycore.ai` in the list
3. If NOT there or NOT verified:
   - Click "Create New Sender"
   - Fill in:
     - From Email: `info@facilitycore.ai`
     - From Name: `FacilityCore`
     - Reply To: `info@facilitycore.ai`
     - Company: `FacilityCore`
     - Address: Your business address
   - Click "Create"
   - Check the `info@facilitycore.ai` inbox for verification email
   - Click the verification link

### Option C: Check API Key Permissions
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Find your current API key
3. Click on it to view permissions
4. If NOT "Full Access":
   - Delete this key
   - Create new key with "Full Access"
   - Update `.env.local`

## Test Command
After making changes:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "85baris@gmail.com", "type": "test"}'
```

## Success Response
You should see:
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

## Common Issues
- **Still Forbidden?** → Use your personal email (85baris@gmail.com)
- **Domain Authentication?** → Not required for single sender verification
- **Email not arriving?** → Check spam folder

## Working Example
```env
SENDGRID_API_KEY=SG.your-key-here
SENDGRID_FROM_EMAIL=85baris@gmail.com  # Use your email for immediate testing
```
