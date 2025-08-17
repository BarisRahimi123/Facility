# Twilio Credentials Setup Guide

## 🔧 Fixed! The Save Error Should Be Resolved

I've fixed the validation issues that were causing errors when saving Twilio credentials. The system now:
- Properly validates empty fields
- Provides clearer error messages
- Handles the format requirements correctly
- Trims whitespace automatically

## 📝 How to Enter Your Twilio Credentials

### 1. **Account SID**
- **Format**: Must start with `AC` and be exactly 34 characters
- **Example**: `ACa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Where to find**: Twilio Console Dashboard (top of the page)
- **Common mistakes to avoid**:
  - Don't include quotes or spaces
  - Make sure it starts with `AC` (not `SK` - that's an API key)
  - Copy the entire 34-character string

### 2. **Auth Token**
- **Format**: 32 characters (letters and numbers)
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p`
- **Where to find**: Twilio Console Dashboard - click "Show" to reveal
- **Common mistakes to avoid**:
  - Don't confuse with API Key Secret
  - Copy the entire token without spaces
  - This is different from your password

### 3. **Phone Number**
- **Format**: Must include `+` and country code
- **Examples**:
  - US: `+14155552671`
  - UK: `+442071838750`
  - Canada: `+16475551234`
- **Where to find**: Twilio Console → Phone Numbers → Manage → Active Numbers
- **Common mistakes to avoid**:
  - Missing the `+` sign
  - Including dashes or parentheses (use only digits)
  - Using your personal phone instead of Twilio number

## 🎯 Step-by-Step Instructions

### Getting Your Credentials from Twilio:

1. **Log in to Twilio Console**: https://console.twilio.com

2. **Get Account SID**:
   - It's displayed on the main dashboard
   - Starts with `AC`
   - Copy all 34 characters

3. **Get Auth Token**:
   - On the same dashboard page
   - Click the "Show" link
   - Copy the revealed token (32 characters)

4. **Get Phone Number**:
   - Go to Phone Numbers → Manage → Active Numbers
   - Copy your Twilio phone number
   - Include the `+` and country code

### Entering in FacilityCore Settings:

1. Go to **Settings → Notifications**
2. Find **SMS Configuration** section
3. Toggle **ON** the SMS Configuration
4. Enter your credentials:
   - **Account SID**: Paste the AC... value
   - **Auth Token**: Paste the token (will be hidden)
   - **Phone Number**: Enter with + and country code
5. Click **Save SMS Settings**

## ⚠️ Common Issues and Solutions

### "Invalid Twilio Account SID"
- Make sure it starts with `AC` (not `SK` or anything else)
- Should be exactly 34 characters
- No spaces or quotes

### "Phone number must include country code"
- Add the `+` at the beginning
- Include country code (1 for US/Canada)
- Format: `+14155552671` not `(415) 555-2671`

### "Missing required fields"
- All three fields are required when SMS is enabled
- Make sure no fields are empty
- Check for accidental spaces

### Settings Not Persisting
- Currently, settings are stored temporarily in memory
- They will need to be re-entered after server restart
- For permanent storage, add to `.env.local`:
  ```env
  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  TWILIO_PHONE_NUMBER=+14155552671
  ```

## 🧪 Testing Your Configuration

After saving your credentials:

1. Enter a test phone number in the **Test Phone Number** field
2. Click **Send Test**
3. You should receive a test SMS

If the test fails:
- Verify all credentials are correct
- For trial accounts, make sure the recipient number is verified in Twilio
- Check that your Twilio phone has SMS capabilities enabled

## 💡 Pro Tips

1. **Copy-Paste Carefully**: Use Ctrl+A to select all, then copy
2. **No Extra Spaces**: The system now trims spaces automatically
3. **Case Sensitive**: Account SID must be uppercase AC
4. **Trial Limitations**: Trial accounts can only send to verified numbers

## 🆘 Still Having Issues?

If you're still getting errors:

1. **Double-check in Twilio Console** that you're copying from the right place
2. **Try refreshing the page** and entering credentials again
3. **Check browser console** (F12) for detailed error messages
4. **Verify your Twilio account** is active and has SMS capabilities

The validation has been improved to give you specific error messages about what's wrong, so the error message should guide you to the solution!
