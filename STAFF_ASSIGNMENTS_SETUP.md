# Staff Assignments System Setup Guide

## Overview
The staff assignments system allows you to assign users to specific rooms and fields, enabling multiple users to manage calendars and see each other's activities.

## Problem Identified
The staff assignment tables (`staff_field_assignments`, `staff_room_assignments`, `room_blockout_dates`) do not exist in the database, which is why the assignment functionality is not working.

## Solution: Apply the Migration

### Step 1: Open Supabase Dashboard
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the sidebar

### Step 2: Apply the Migration
1. Copy the SQL from `supabase/migrations/20250124_staff_field_room_assignments.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the migration

### Step 3: Verify the Setup
After applying the migration, run this command to verify:
```bash
node scripts/check-staff-assignments.js
```

You should see:
- ✅ staff_field_assignments table is now accessible
- ✅ staff_room_assignments table is now accessible  
- ✅ room_blockout_dates table is now accessible

## How to Use Staff Assignments

### For Rooms
1. Navigate to any facility → building → room details
2. Click the **Assign Staff** button in the room management section
3. Select a user, assign a role (staff/coordinator/manager)
4. Set permissions (manage calendar, create blockouts, etc.)
5. Click **Assign Staff**

### For Fields  
1. Navigate to any facility → Fields tab
2. Find a field and click **Assign Staff** 
3. Select a user, assign a role (staff/coordinator/manager)
4. Set permissions (manage calendar, create blockouts, etc.)
5. Click **Assign Staff**

## Calendar Collaboration Features

Once staff are assigned to rooms/fields, they can:

1. **View Each Other's Events**: The calendar system aggregates all events from assigned users
2. **Create Events**: Assigned staff can create reservations and maintenance events
3. **Manage Blockouts**: Staff can create blackout periods for their assigned rooms/fields
4. **Collaborative Management**: Multiple staff can manage the same space with role-based permissions

## Current Status
- ✅ Fields available: 3 fields ready for assignment
- ✅ Rooms available: 3 rooms ready for assignment
- ✅ Users available: 1 assignable user (baris@plansrow.net)
- ❌ Assignment tables: Need to be created via migration

## Next Steps
1. Apply the migration as described above
2. Test staff assignments by assigning the available user to a room and field
3. Verify calendar functionality shows collaborative events
4. Add more users if needed for testing multiple user collaboration

## Technical Details

### Database Tables Created
- `staff_field_assignments`: Links users to specific fields with permissions
- `staff_room_assignments`: Links users to specific rooms with permissions  
- `room_blockout_dates`: Manages room availability restrictions

### Permissions System
Each assignment includes granular permissions:
- `manage_calendar`: Can view and edit calendar events
- `create_blockouts`: Can create unavailable periods
- `view_reservations`: Can see booking details
- `manage_reservations`: Can approve/modify bookings
- `view_reports`: Can access usage analytics

### Role Hierarchy
- **Manager**: Full permissions for assigned spaces
- **Coordinator**: Can manage events and blockouts
- **Staff**: Basic calendar and viewing permissions 