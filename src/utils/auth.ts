'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { mapLegacyRole, canInviteRole, hasOrgAccess, type UserRole } from '@/types/user';

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

// Hook to get current user and role
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          return;
        }

        // Get user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: mapLegacyRole(profile?.role),
          organization_id: profile?.organization_id
        });
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: mapLegacyRole(profile?.role),
          organization_id: profile?.organization_id
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
      // Force redirect even on error
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  };

  return {
    user,
    loading,
    isAdmin: isAdminRole(user?.role),
    isMasterAdmin: user?.role === 'master_admin',
    isSubAdmin: user?.role === 'sub_admin',
    isStaff: user?.role === 'staff',
    canInvite: canInviteUsers(user?.role),
    allowedInviteRoles: getAllowedInviteRoles(user?.role),
    organizationId: user?.organization_id,
    signOut
  };
}

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
  const { user, loading, organizationId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !organizationId) {
      toast.error('You must be assigned to an organization');
      router.push('/');
    }
  }, [user, loading, organizationId, router]);

  return { user, loading, organizationId };
} 