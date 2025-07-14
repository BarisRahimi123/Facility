# Authentication Architecture & Implementation Guide

## 🔐 E🧩 Authentication and User Role Structure

### 1. User Role Hierarchy

The platform implements a multi-tenant authentication system with three distinct tiers:

#### 🌟 **Master Admin (Platform Owner)**
- **Role Name**: `master_admin`
- **Scope**: Platform-wide access
- **Capabilities**:
  - Create and manage Sub Admin accounts
  - View and manage all organizations' data
  - Access platform-level analytics and settings
  - Manage global billing and subscriptions
  - Override any permission or restriction

#### 🏢 **Sub Admin (Organization Owner)**
- **Role Name**: `sub_admin`
- **Scope**: Organization-specific access
- **Capabilities**:
  - Manage only their organization's data
  - Create and manage facilities, fields, and buildings
  - Invite and manage Staff Users
  - View organization-level analytics
  - Cannot access other organizations' data

#### 👷 **Staff Users (Team Members)**
- **Role Name**: `staff`
- **Scope**: Limited access within organization
- **Capabilities**:
  - Access only assigned facilities/resources
  - Permissions set by Sub Admin
  - Cannot invite other users
  - Cannot access organization settings

### 2. Data Isolation Architecture

#### Database Schema
```sql
-- Each Sub Admin represents a separate tenant/organization
organizations
  ├── id (UUID)
  ├── name
  ├── type ('master', 'tenant')
  ├── created_by (references Master Admin)
  └── settings (JSONB)

-- All users belong to an organization
users
  ├── id (UUID)
  ├── email
  ├── role ('master_admin', 'sub_admin', 'staff')
  ├── organization_id (references organizations.id)
  └── permissions (JSONB)

-- All resources are owned by organizations
facilities
  ├── id (UUID)
  ├── organization_id (references organizations.id)
  └── [facility data]

buildings, fields, rooms, etc.
  └── All inherit organization_id through relationships
```

#### Row Level Security (RLS) Implementation
```sql
-- Example RLS policy for facilities
CREATE POLICY "Organization data isolation" ON facilities
FOR ALL USING (
  -- Master admins see all
  auth.jwt() ->> 'role' = 'master_admin'
  OR
  -- Others see only their organization's data
  organization_id = auth.jwt() ->> 'organization_id'
);
```

### 3. Access Control Matrix

| Action | Master Admin | Sub Admin | Staff |
|--------|--------------|-----------|--------|
| View all organizations | ✅ | ❌ | ❌ |
| Create organizations | ✅ | ❌ | ❌ |
| Manage own org data | ✅ | ✅ | ⚠️ (limited) |
| Invite sub admins | ✅ | ❌ | ❌ |
| Invite staff | ✅ | ✅ | ❌ |
| View platform analytics | ✅ | ❌ | ❌ |
| View org analytics | ✅ | ✅ | ⚠️ (if permitted) |

### 4. Implementation Steps

#### Step 1: Update User Roles
```sql
-- Update user_role enum to three-tier system
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('master_admin', 'sub_admin', 'staff');

-- Migrate existing roles
ALTER TABLE users 
ALTER COLUMN role TYPE user_role 
USING CASE 
  WHEN role::text IN ('master_admin', 'district_approver') THEN 'master_admin'::user_role
  WHEN role::text IN ('sub_master', 'site_approver') THEN 'sub_admin'::user_role
  ELSE 'staff'::user_role
END;

DROP TYPE user_role_old;
```

#### Step 2: Create Organization Types
```sql
-- Add organization type to distinguish master org from tenant orgs
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'tenant' 
CHECK (org_type IN ('master', 'tenant'));

-- Master organization for platform owner
INSERT INTO organizations (name, org_type, created_at)
VALUES ('Platform Master Organization', 'master', NOW())
ON CONFLICT DO NOTHING;
```

#### Step 3: Implement Data Isolation
```sql
-- Add organization_id to all resource tables
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX idx_facilities_org ON facilities(organization_id);
CREATE INDEX idx_fields_org ON fields(organization_id);
CREATE INDEX idx_buildings_org ON buildings(organization_id);
```

#### Step 4: RLS Policies for Data Isolation
```sql
-- Enable RLS on all tables
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Facilities policy
CREATE POLICY "org_isolation_facilities" ON facilities
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'master_admin' 
      OR users.organization_id = facilities.organization_id
    )
  )
);

-- Similar policies for other tables...
```

### 5. Invitation Flow

#### Master Admin → Sub Admin
1. Master Admin creates organization
2. Master Admin invites Sub Admin with organization assignment
3. Sub Admin accepts invitation and gains org access

#### Sub Admin → Staff
1. Sub Admin invites Staff within their organization
2. Staff inherits organization_id from inviter
3. Staff can only see their organization's data

### 6. API Implementation

#### Authentication Middleware
```typescript
export async function checkOrgAccess(userId: string, resourceOrgId: string) {
  const user = await getUser(userId);
  
  // Master admins bypass all checks
  if (user.role === 'master_admin') return true;
  
  // Others must match organization
  return user.organization_id === resourceOrgId;
}
```

#### Query Filtering
```typescript
export async function getFacilities(userId: string) {
  const user = await getUser(userId);
  
  let query = supabase.from('facilities').select('*');
  
  // Apply org filter for non-master users
  if (user.role !== 'master_admin') {
    query = query.eq('organization_id', user.organization_id);
  }
  
  return query;
}
```

### 7. Security Considerations

1. **JWT Claims**: Include organization_id in JWT for RLS
2. **API Validation**: Always validate org access server-side
3. **Audit Trail**: Log all cross-organization access attempts
4. **Data Exports**: Ensure exports respect org boundaries
5. **Webhooks**: Filter events by organization

### 8. Migration Plan

1. **Phase 1**: Update role system (1 day)
   - Migrate existing roles to 3-tier system
   - Update authentication checks

2. **Phase 2**: Implement organizations (2 days)
   - Add organization_id to all tables
   - Migrate existing data to organizations

3. **Phase 3**: Enable RLS (1 day)
   - Create and test RLS policies
   - Verify data isolation

4. **Phase 4**: Update UI/UX (2 days)
   - Organization switcher for Master Admin
   - Update permission checks in UI
   - Test all user flows

### 9. Testing Strategy

1. **Unit Tests**: Role permission checks
2. **Integration Tests**: Data isolation scenarios
3. **E2E Tests**: Complete user journeys
4. **Security Tests**: Attempted cross-org access

### 10. Monitoring & Compliance

- Track organization resource usage
- Monitor cross-organization access attempts
- Regular security audits
- Compliance reporting per organization 