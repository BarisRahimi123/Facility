# Field Reservations System Setup Guide

This guide will help you set up the field reservations system with full Supabase integration, including the funnel view functionality.

## Overview

The Field Reservations system allows facility managers to:
- Track field bookings and reservations
- View reservations in table, calendar, and funnel views
- Approve/reject pending reservations
- Track revenue and payment status
- Manage the complete reservation lifecycle

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Environment Variables**: Ensure these are set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Step 1: Check Current Setup

Run the diagnostic script to check if the reservations table exists:

```bash
node scripts/check-reservations-table.js
```

This will tell you whether the table exists and show its structure.

## Step 2: Create Database Tables

If the reservations table doesn't exist, you need to create it:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and run ONE of these migration files:

### Option A: Complete Reservation System (Recommended)
Use this for a full-featured reservation system:
```sql
-- Copy content from: supabase/migrations/20250123_rental_reservation_system_complete_fixed.sql
```

### Option B: Basic Fields & Reservations
Use this for a simpler setup:
```sql
-- Copy content from: supabase/migrations/20250117_create_fields_and_reservations_tables.sql
```

## Step 3: Verify the Setup

After running the migration, verify everything is working:

```bash
# Check reservations table
node scripts/check-reservations-table.js

# Check fields table (if not already created)
node scripts/check-fields-schema.js
```

## Step 4: Understanding the Funnel View

The funnel view shows the progression of reservations through different stages:

1. **Inquiries** - All reservation requests
2. **Pending Approval** - Awaiting admin approval
3. **Approved** - Confirmed bookings
4. **Paid** - Payment completed
5. **Completed** - Events finished

### Key Features:
- **Visual Indicators**: Pending reservations pulse and have yellow highlighting
- **Quick Actions**: Approve/Reject buttons on pending items
- **Revenue Tracking**: See revenue at each stage
- **Conversion Rates**: Automatic calculation of stage-to-stage conversion

## Step 5: Using the System

### For Administrators:

1. **View Reservations**:
   - Navigate to Facility → Fields → Reservations tab
   - Switch between Table, Funnel, and Calendar views
   - Use filters to find specific reservations

2. **Approve/Reject Reservations**:
   - In Funnel view, pending items are highlighted
   - Click reservation cards to view details
   - Use quick action buttons to approve/reject
   - Provide reasons for rejections

3. **Track Revenue**:
   - Stats cards show total revenue, upcoming reservations
   - Funnel view shows revenue by stage
   - Filter by date range, field, or status

### For Renters:

1. **Make Reservations**:
   - Browse available fields
   - Select dates and times
   - Submit reservation request
   - Receive confirmation after approval

## Troubleshooting

### "Reservations table does not exist" Error

1. Ensure you've run the migration (Step 2)
2. Check you're connected to the correct Supabase project
3. Verify environment variables are correct

### No Reservations Showing

1. Check if the table is empty (normal for new setup)
2. Create test reservations through the UI
3. Verify facility_id matches in queries

### Approval Actions Not Working

1. Ensure you have proper permissions
2. Check browser console for errors
3. Verify the updateReservationStatus function has correct status values

## Database Schema

The reservations table includes:

```sql
- id (UUID)
- field_id (UUID) - References fields table
- facility_id (UUID) - References facilities table
- user_id (UUID) - References users table
- renter_name (Text)
- renter_email (Text)
- renter_phone (Text)
- organization_name (Text)
- start_time (Timestamp)
- end_time (Timestamp)
- booking_type (Text) - 'hourly' or 'daily'
- status (Text) - 'pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed'
- payment_status (Text) - 'pending', 'paid', 'partial', 'refunded'
- total_amount (Numeric)
- And many more fields...
```

## Security Considerations

1. **Row Level Security (RLS)**: The migration includes RLS policies
2. **Service Role**: Server actions use service role for admin operations
3. **User Permissions**: Only authorized users can approve/reject
4. **Data Isolation**: Reservations are filtered by facility

## Next Steps

1. **Email Notifications**: Set up email alerts for new reservations
2. **Payment Integration**: Connect Stripe for online payments
3. **Reporting**: Create detailed revenue reports
4. **Calendar Sync**: Export to Google Calendar/Outlook

## Support

If you encounter issues:

1. Check the browser console for errors
2. Run diagnostic scripts
3. Review Supabase logs
4. Check that all migrations have been applied

The reservation system is now ready to manage your facility's field bookings efficiently! 