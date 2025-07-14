// Three-tier authentication roles
export type UserRole = 'master_admin' | 'sub_admin' | 'staff';

// Legacy role mapping for backward compatibility
export type LegacyUserRole = 'district_approver' | 'site_approver' | 'manager' | 'coordinator' | 'vendor' | 'renter' | 'maintenance';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  organization_id?: string;
  organization?: Organization;
  department?: string;
  position?: string;
  company?: string;
  services?: string[];
  invited_by?: string;
  invited_at?: string;
  permissions?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  org_type: 'master' | 'tenant';
  type: 'district' | 'school' | 'renter';
  display_name?: string;
  is_active: boolean;
  parent_org_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// Permission types for staff users
export interface StaffPermissions {
  manage_calendar: boolean;
  create_blockouts: boolean;
  view_reservations: boolean;
  manage_reservations: boolean;
  view_reports: boolean;
  manage_fields?: boolean;
  manage_facilities?: boolean;
}

// Role capabilities
export const RoleCapabilities = {
  master_admin: {
    canCreateOrganizations: true,
    canInviteSubAdmins: true,
    canInviteStaff: false,
    canViewAllData: true,
    canManageBilling: true,
    canAccessPlatformSettings: true,
  },
  sub_admin: {
    canCreateOrganizations: false,
    canInviteSubAdmins: false,
    canInviteStaff: true,
    canViewAllData: false, // Only their organization
    canManageBilling: false,
    canAccessPlatformSettings: false,
  },
  staff: {
    canCreateOrganizations: false,
    canInviteSubAdmins: false,
    canInviteStaff: false,
    canViewAllData: false,
    canManageBilling: false,
    canAccessPlatformSettings: false,
  },
} as const;

// Helper functions
export function mapLegacyRole(legacyRole?: string): UserRole {
  if (!legacyRole) return 'staff';
  
  const mapping: Record<string, UserRole> = {
    'master_admin': 'master_admin',
    'district_approver': 'master_admin',
    'sub_admin': 'sub_admin',
    'sub_master': 'sub_admin',
    'site_approver': 'sub_admin',
    'manager': 'sub_admin',
    'coordinator': 'sub_admin',
    'staff': 'staff',
    'vendor': 'staff',
    'renter': 'staff',
    'maintenance': 'staff',
    'support': 'staff',
  };
  
  return mapping[legacyRole] || 'staff';
}

export function canInviteRole(inviterRole: UserRole, inviteeRole: UserRole): boolean {
  if (inviterRole === 'master_admin' && inviteeRole === 'sub_admin') {
    return true;
  }
  
  if (inviterRole === 'sub_admin' && inviteeRole === 'staff') {
    return true;
  }
  
  return false;
}

export function hasOrgAccess(userRole: UserRole, userOrgId?: string, resourceOrgId?: string): boolean {
  // Master admins have access to everything
  if (userRole === 'master_admin') {
    return true;
  }
  
  // Others must match organization
  return userOrgId === resourceOrgId;
} 