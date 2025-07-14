# Field Reservation Setup Guide

## Issue
When new users try to reserve a field, they get a "User not authenticated" error because the reservations table doesn't exist in your database.

## Solution

### 1. Create the Reservations Table

Go to your Supabase SQL Editor and run the following SQL:

```sql
-- Copy and paste the contents of scripts/apply-reservations-table-simple.sql
```

This will create the `reservations` table with all necessary columns for storing field bookings.

### 2. How the Reservation Flow Works

The updated reservation flow now works as follows:

1. **New User Browses Fields**: User explores facilities and fields on the landing page
2. **Add to Cart**: User selects dates/times and adds bookings to their cart
3. **Checkout**: User fills out event details and acknowledges policies
4. **Submit Reservation**: When clicking "Submit Reservation Request":
   - If not logged in → Reservation data is saved to browser storage
   - Auth modal appears with sign-up/sign-in options
   - User creates account or signs in
5. **Auto-Submit**: After successful authentication:
   - System detects pending reservation data
   - Automatically submits the reservation to database
   - Shows success message
   - Redirects to user dashboard

### 3. Key Features Implemented

- **Data Preservation**: Reservation details are saved when users need to sign up
- **Auto-Submit**: After sign-up, the reservation is automatically completed
- **User Feedback**: Clear messaging about what's happening at each step
- **Loading States**: Visual feedback during reservation submission

### 4. Testing the Flow

1. Open an incognito/private browser window (to test as new user)
2. Go to your landing page
3. Click on a field to open the reservation modal
4. Add bookings to cart
5. Proceed to checkout
6. Fill out all details and acknowledge policies
7. Click "Submit Reservation Request"
8. You should see the auth modal with your reservation summary
9. Create a new account
10. After sign-up, your reservation should auto-submit

### 5. Verify Everything Works

Run this command to check the setup:
```bash
node scripts/test-reservation-flow.js
```

### 6. Next Steps

After reservations are working:
- Staff can view reservations in their dashboard
- Reservations show as "pending" until approved
- Calendar automatically blocks reserved times
- Email notifications can be configured

## Troubleshooting

**Error: "reservations table does not exist"**
- Run the SQL script in step 1

**Error: "User not authenticated" still appears**
- Check browser console for localStorage errors
- Ensure cookies are enabled
- Try clearing browser cache

**Reservation doesn't auto-submit after sign-up**
- Check browser console for errors
- Verify the pending reservation data exists in localStorage
- Ensure the user dashboard page loads after sign-up 