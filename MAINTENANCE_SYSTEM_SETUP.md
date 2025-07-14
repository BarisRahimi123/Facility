# Maintenance System Setup Guide

## Overview

The maintenance system in Facilitycore provides comprehensive task management with features for:
- Creating and tracking maintenance tasks
- Assigning tasks to internal staff
- Inviting external contractors
- Request for quotes (RFQ) management
- Task activity logging and comments

## Database Setup

### 1. Apply the Migration

The maintenance system requires several database tables. Apply the migration using one of these methods:

#### Option A: Using the Script (Recommended)
```bash
node scripts/apply-maintenance-migration.js
```

#### Option B: Manual Application
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250131_create_maintenance_system.sql`
4. Paste and execute in the SQL Editor

### 2. Tables Created

The migration creates the following tables:

- **maintenance_tasks** - Main tasks table
- **task_assignments** - Internal staff assignments
- **task_contractor_invitations** - External contractor invitations
- **task_attachments** - File attachments for tasks
- **task_comments** - Task comments and discussions
- **task_activity_log** - Activity history
- **vendors** - Approved vendors list
- **request_for_quotes** - RFQ management
- **rfq_vendor_invitations** - Vendor invitations for RFQs

## Features

### 1. Task Creation

Tasks can be created with:
- Basic information (title, description, type, priority)
- Facility and optional building/room assignment
- Location details
- Start date and estimated duration
- Assignment options (none, internal staff, external contractors)

### 2. Staff Assignment

Internal staff can be assigned with roles:
- **Assignee** - Primary person responsible
- **Observer** - Receives updates but not responsible
- **Approver** - Can approve task completion

### 3. External Contractor Invitations

Invite external contractors by:
- Email address
- Optional phone number
- Company name
- Role (contractor, vendor, consultant)

Contractors receive a secure invitation link valid for 7 days.

### 4. Task Management

- Update task status (new, pending, in_progress, completed, cancelled)
- Add comments and attachments
- View activity history
- Track time and costs

## User Permissions

### Master Admin
- Full access to all tasks across all organizations
- Can create and manage tasks for any facility
- Bypass organization restrictions

### Sub Admin / Organization Users
- Access only tasks within their organization
- Can create and manage tasks for their facilities
- Cannot see tasks from other organizations

### Staff Members
- View tasks assigned to them
- Update task status and add comments
- Cannot create new tasks (unless given permission)

## API Usage

### Creating a Task

```typescript
import { createMaintenanceTask } from '@/app/actions/maintenance';

const result = await createMaintenanceTask({
  title: 'Fix HVAC Unit',
  description: 'AC not cooling properly',
  type: 'corrective',
  priority: 'high',
  facilityId: 'facility-uuid',
  buildingId: 'building-uuid', // optional
  location: 'Room 201',
  assignmentType: 'internal',
  internalAssignments: [{
    userId: 'staff-uuid',
    role: 'assignee'
  }]
});
```

### Getting Tasks

```typescript
import { getMaintenanceTasks } from '@/app/actions/maintenance';

// Get all tasks
const tasks = await getMaintenanceTasks();

// Get tasks for specific facility
const facilityTasks = await getMaintenanceTasks('facility-uuid');
```

### Updating a Task

```typescript
import { updateMaintenanceTask } from '@/app/actions/maintenance';

const result = await updateMaintenanceTask('task-uuid', {
  status: 'in_progress',
  notes: 'Started working on the issue'
});
```

### Assigning Staff

```typescript
import { assignTaskToStaff } from '@/app/actions/maintenance';

const result = await assignTaskToStaff('task-uuid', [
  {
    userId: 'staff-uuid',
    role: 'assignee'
  },
  {
    userId: 'manager-uuid',
    role: 'approver'
  }
]);
```

### Inviting Contractors

```typescript
import { inviteContractorToTask } from '@/app/actions/maintenance';

const result = await inviteContractorToTask('task-uuid', [
  {
    email: 'contractor@example.com',
    phone: '+1-555-1234',
    company_name: 'ABC Repairs',
    role: 'contractor'
  }
]);
```

## UI Components

### MaintenanceTaskModal
- Located at: `src/components/maintenance/MaintenanceTaskModal.tsx`
- Handles task creation with assignment options
- Supports both internal and external assignments

### Maintenance Page
- Located at: `src/app/(app)/maintenance/page.tsx`
- Main dashboard for viewing and managing tasks
- Supports multiple view modes (board, table, calendar)

## Email Integration

The system is designed to send emails for:
- External contractor invitations
- Task assignments
- Status updates

To enable email sending:
1. Configure your email service (SendGrid, Mailgun, etc.)
2. Update the TODO sections in the server actions
3. Use the invitation tokens for secure contractor access

## Best Practices

1. **Always specify facility** - Tasks must belong to a facility
2. **Use proper task types** - preventive for scheduled, corrective for issues
3. **Set realistic priorities** - Reserve 'critical' for true emergencies
4. **Track activity** - All changes are logged automatically
5. **Invite contractors early** - Give them time to respond to RFQs

## Troubleshooting

### Tables not found
- Ensure the migration was applied successfully
- Check RLS policies are not blocking access
- Verify your user has proper permissions

### Cannot create tasks
- Check user has organization_id set
- Verify facility belongs to user's organization
- Ensure all required fields are provided

### Contractors not receiving invitations
- Email service needs to be configured
- Check invitation status in task_contractor_invitations table
- Verify email addresses are correct

## Next Steps

1. Configure email service for contractor invitations
2. Set up vendor management
3. Implement RFQ workflow
4. Add cost tracking and reporting
5. Create mobile app for field technicians 