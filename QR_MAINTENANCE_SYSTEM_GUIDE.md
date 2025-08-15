# QR Code Maintenance Issue Reporting System

## Overview

I've implemented a comprehensive maintenance issue reporting system with QR code support. This allows users to quickly report maintenance issues by scanning QR codes placed around your facilities.

## Features Implemented

### 1. **QR Code Generation & Management**
- Generate unique QR codes for any location (facility, building, room, or field)
- QR codes link to a public reporting page
- Facility managers can create, view, download, and delete QR codes
- Each QR code has a unique identifier (format: QR-XXXX-XXXX-XXXX)

### 2. **Issue Reporting System**
- **Public Reporting Page** (`/report-issue?code=QR-XXXX-XXXX-XXXX`)
  - Works without authentication
  - Pre-fills location based on QR code
  - Supports image uploads (up to 5 photos)
  - Optional contact information
  - Priority levels: Low, Medium, High, Urgent
  - Categories: Electrical, Plumbing, HVAC, Structural, Safety, etc.

- **Manual Issue Reporting** (for staff)
  - Report issues directly from maintenance page
  - Select specific locations manually
  - Same features as QR code reporting

### 3. **Issue to Task Conversion**
- Convert reported issues to maintenance tasks
- Automatic priority mapping
- Issue history preserved in task metadata
- Activity logging for audit trail

### 4. **Workflow Features**
- Issue statuses: Pending → Acknowledged → Assigned → In Progress → Resolved → Closed
- Automatic timestamps for each status change
- Activity logging for all changes
- Link between issues and created tasks

## Database Schema

### Tables Created:
1. **maintenance_qr_codes** - Stores QR code information
2. **maintenance_issue_reports** - Stores reported issues
3. **maintenance_issue_activities** - Logs all issue activities

### Key Functions:
- `generate_qr_code()` - Creates unique QR codes
- `convert_issue_to_task()` - Converts issues to maintenance tasks
- `log_issue_activity()` - Tracks all changes

## How to Set Up

### Step 1: Apply Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents from: `supabase/migrations/20250131_create_qr_maintenance_system.sql`
5. Click **Run** to execute the migration

### Step 2: Configure Environment Variables

Ensure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Step 3: Test the System

1. **Create a QR Code:**
   - Go to Maintenance page
   - Find the "QR Code Management" section
   - Click "Generate QR Code"
   - Select a location (facility, building, room, or field)
   - Click "Generate"

2. **Download & Print QR Code:**
   - Click the download button on any QR code
   - Print and place at the physical location

3. **Test Issue Reporting:**
   - Click the external link button on a QR code
   - Or scan the printed QR code with a phone
   - Fill out the issue report form
   - Submit

4. **View Reported Issues:**
   - Issues appear in the maintenance page
   - Can be converted to tasks for assignment

## User Workflows

### For Facility Users (Public):
1. Scan QR code with phone camera
2. Opens reporting page with location pre-filled
3. Describe the issue
4. Add photos if needed
5. Submit report

### For Facility Managers:
1. **Setup:** Generate QR codes for all locations
2. **Print:** Download and print QR codes
3. **Place:** Put QR codes at physical locations
4. **Monitor:** View incoming issue reports
5. **Assign:** Convert issues to tasks and assign to staff

### For Maintenance Staff:
1. View assigned tasks from converted issues
2. Update task status as work progresses
3. Mark issues as resolved when complete

## Components Created

### Frontend Components:
- `IssueReportModal.tsx` - Modal for manual issue reporting
- `QRCodeManager.tsx` - QR code generation and management UI
- `/report-issue/page.tsx` - Public issue reporting page

### Server Actions:
- `maintenanceIssues.ts` - All backend logic for QR codes and issues

### Database Migration:
- `20250131_create_qr_maintenance_system.sql` - Complete schema

## Security Features

- QR codes can be deactivated if compromised
- Public reporting doesn't require authentication
- Staff-only access to QR code management
- RLS policies protect data access
- Activity logging for audit trails

## Best Practices

1. **QR Code Placement:**
   - Place at eye level
   - Protect from weather
   - Include text: "Scan to Report Issue"
   - Test scanning from typical distances

2. **Location Naming:**
   - Use clear, descriptive names
   - Include room numbers
   - Add location details (e.g., "Near main entrance")

3. **Issue Management:**
   - Review new issues daily
   - Set priority based on safety impact
   - Convert urgent issues to tasks immediately
   - Keep reporters informed of progress

## Troubleshooting

### QR Code Not Working:
- Check if QR code is active in system
- Verify NEXT_PUBLIC_APP_URL is correct
- Test with the external link button first

### Issues Not Appearing:
- Check database migration was applied
- Verify user has proper permissions
- Check facility filter settings

### Can't Generate QR Codes:
- Ensure you're logged in as staff/admin
- Check if pgcrypto extension is enabled
- Verify database migration completed

## Future Enhancements

Consider adding:
- Email notifications for new issues
- SMS alerts for urgent issues
- Photo compression before upload
- Automatic issue categorization
- Response time tracking
- Contractor assignment from issues
- Mobile app for staff
- Analytics dashboard

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all migrations are applied
3. Ensure environment variables are set
4. Check Supabase logs for database errors

The system is now ready for use! Start by generating QR codes for your key locations and testing the reporting flow.





