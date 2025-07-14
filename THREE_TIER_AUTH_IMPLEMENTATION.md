# Three-Tier Authentication Implementation Guide

## 📋 Implementation Checklist

### ✅ Database Migration Required

Run the following migration in your Supabase SQL Editor:

```sql
-- Copy the entire contents of: 
-- supabase/migrations/20250131_three_tier_authentication.sql
```

This migration will:
1. Update user roles to 3-tier system (master_admin, sub_admin, staff)
2. Add organization_id to resource tables
3. Create RLS policies for data isolation
4. Update invitation system

### 🔧 Code Updates Completed

1. **User Types** (`src/types/user.ts`)
   - ✅ Updated UserRole to 3-tier system
   - ✅ Added Organization interface
   - ✅ Added role capability mapping
   - ✅ Added helper functions for role checks

2. **Auth Utilities** (`src/utils/auth.ts`)
   - ✅ Updated role checking functions
   - ✅ Added organization access checks
   - ✅ Added hooks for role/org requirements

3. **Facilities Actions** (`src/app/actions/facilities.ts`)
   - ✅ Implemented organization-based filtering
   - ✅ Added permission checks for create/update/delete
   - ✅ Master admins see all, others see only their org

### 📝 Components to Update

#### 1. People Page (`src/app/(app)/people/page.tsx`)
Update role checks:
```typescript
// Old
const adminRoles = ['admin', 'staff', 'manager', 'coordinator', 'district_approver', 'site_approver', 'master_admin', 'sub_master'];

// New
const adminRoles = ['master_admin', 'sub_admin'];
```

#### 2. AddUserModal (`src/components/people/AddUserModal.tsx`)
Update role options based on current user:
```typescript
// Get allowed roles
const { allowedInviteRoles } = useAuth();

// Show only roles user can invite
{allowedInviteRoles.map(role => (
  <SelectItem key={role} value={role}>
    {role === 'sub_admin' ? 'Sub Admin' : 'Staff'}
  </SelectItem>
))}
```

#### 3. InviteUserModal (`src/components/people/InviteUserModal.tsx`)
Similar updates for invitation roles.

#### 4. Sign-in Redirects (`src/app/auth/sign-in/page.tsx`)
Update redirect logic:
```typescript
const userRole = mapLegacyRole(userProfile?.role);

let redirectUrl = '/facilities-map'; // default
if (userRole === 'master_admin') {
  redirectUrl = '/people';
} else if (userRole === 'sub_admin') {
  redirectUrl = '/facilities';
} else if (userRole === 'staff') {
  redirectUrl = '/staff';
}
```

### 🏢 Organization Management

#### Create Organization Switcher (for Master Admin)
```typescript
// src/components/layout/OrganizationSwitcher.tsx
export function OrganizationSwitcher() {
  const { isMasterAdmin, organizationId } = useAuth();
  
  if (!isMasterAdmin) return null;
  
  // Show dropdown to switch between organizations
  return (
    <Select value={organizationId} onValueChange={switchOrganization}>
      {/* List all organizations */}
    </Select>
  );
}
```

#### Update Navigation Components
Add organization context to TopBar and Sidebar.

### 🔒 Data Access Patterns

#### Server Actions Template
```typescript
export async function getResources() {
  const supabase = await createServerSupabaseClient();
  const { user } = await supabase.auth.getUser();
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();
    
  const userRole = mapLegacyRole(userProfile.role);
  
  let query = supabase.from('resources').select('*');
  
  // Apply org filter for non-master admins
  if (userRole !== 'master_admin' && userProfile.organization_id) {
    query = query.eq('organization_id', userProfile.organization_id);
  }
  
  return query;
}
```

### 🧪 Testing the Implementation

1. **Test Master Admin Access**
   - Sign in as 85baris@gmail.com
   - Should see all organizations
   - Can create sub admins
   - Can access all data

2. **Test Sub Admin Access**
   - Create a sub admin account
   - Should only see their organization
   - Can invite staff
   - Cannot see other org data

3. **Test Staff Access**
   - Create staff under sub admin
   - Limited to assigned resources
   - Cannot invite users
   - Cannot access org settings

### 🚨 Important Notes

1. **Backward Compatibility**
   - Legacy roles are automatically mapped
   - Existing data assigned to default organization
   - No data loss during migration

2. **Security Considerations**
   - RLS policies enforce data isolation
   - Always check organization_id in queries
   - Master admin access should be limited

3. **Performance**
   - Indexes added for organization_id
   - Consider partitioning for large scale

### 📊 Organization Structure Example

```
Platform Master Organization (Master Admin)
├── School District A (Sub Admin)
│   ├── Staff User 1
│   ├── Staff User 2
│   └── Facilities, Fields, Buildings...
├── School District B (Sub Admin)
│   ├── Staff User 3
│   ├── Staff User 4
│   └── Facilities, Fields, Buildings...
└── Company C (Sub Admin)
    ├── Staff User 5
    └── Facilities, Fields, Buildings...
```

### 🔄 Next Steps

1. Run the database migration
2. Test with existing user accounts
3. Update remaining components as needed
4. Add organization management UI
5. Implement billing per organization 