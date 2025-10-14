'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { mapLegacyRole, canInviteRole, hasOrgAccess, type UserRole } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organization_id?: string;
}

// Three-tier role hierarchy
export const ROLE_HIERARCHY: UserRole[] = ['master_admin', 'sub_admin', 'staff'];

// Check if user has administrative privileges
export function isAdminRole(role?: UserRole): boolean {
  return role === 'master_admin' || role === 'sub_admin';
}

// Check if user can invite other users
export function canInviteUsers(role?: UserRole): boolean {
  return role === 'master_admin' || role === 'sub_admin';
}

// Get allowed roles that a user can invite
export function getAllowedInviteRoles(role?: UserRole): UserRole[] {
  if (role === 'master_admin') {
    return ['sub_admin'];
  }
  
  if (role === 'sub_admin') {
    return ['staff'];
  }
  
  return [];
}

// Check if user can access a specific organization's data
export function canAccessOrganization(
  userRole: UserRole,
  userOrgId?: string,
  targetOrgId?: string
): boolean {
  return hasOrgAccess(userRole, userOrgId, targetOrgId);
}

// REMOVED: Duplicate useAuth hook - use AuthContext instead

// Hook to protect routes based on role
export function useRequireRole(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !allowedRoles.includes(user.role))) {
      toast.error('You do not have permission to access this page');
      router.push('/');
    }
  }, [user, loading, allowedRoles, router]);

  return { user, loading };
}

// Hook to protect routes based on organization
export function useRequireOrganization() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.organization_id) {
      toast.error('You must be assigned to an organization');
      router.push('/');
    }
  }, [user, loading, router]);

  return { user, loading, organizationId: user?.organization_id };
} 