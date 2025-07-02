'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type UserRole = 'master_admin' | 'sub_master' | 'admin' | 'staff' | 'manager' | 'coordinator' | 'vendor' | 'renter' | 'district_approver' | 'site_approver' | 'maintenance' | 'support';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole | null;
}

// Admin roles that have access to admin pages
export const ADMIN_ROLES: UserRole[] = ['master_admin', 'sub_master', 'admin', 'staff', 'manager', 'coordinator', 'district_approver', 'site_approver'];

// Roles that can invite other users
export const INVITE_ROLES: UserRole[] = ['master_admin', 'sub_master', 'district_approver', 'site_approver'];

// Map old roles to new roles for compatibility
export const ROLE_MAPPING: Record<string, UserRole> = {
  'district_approver': 'master_admin',
  'site_approver': 'sub_master',
  'admin': 'master_admin',
  'staff': 'staff',
  'manager': 'manager',
  'coordinator': 'coordinator',
  'vendor': 'vendor',
  'renter': 'renter',
  'maintenance': 'maintenance',
  'support': 'support'
};

// Check if a role has admin privileges
export function isAdminRole(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as UserRole);
}

// Check if a role can invite users
export function canInviteUsers(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return INVITE_ROLES.includes(role as UserRole);
}

// Map old roles to new roles
export function mapRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  return ROLE_MAPPING[role] || (role as UserRole);
}

// Hook to get current user and role
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          return;
        }

        // Get user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: mapRole(profile?.role)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: mapRole(profile?.role)
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
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  return {
    user,
    loading,
    isAdmin: isAdminRole(user?.role),
    canInvite: canInviteUsers(user?.role),
    signOut
  };
}

// Hook to protect admin pages
export function useAdminAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in
        toast.error('Please sign in to access this page');
        router.push('/auth/sign-in');
        return;
      }
      
      if (!isAdminRole(user.role)) {
        // Not authorized
        toast.error('You do not have permission to access this page');
        router.push('/facilities-map');
        return;
      }
      
      setIsAuthorized(true);
    }
  }, [user, loading, router]);

  return { user, loading, isAuthorized };
}

// Check if user has admin privileges
export function isAdmin(role: UserRole | null): boolean {
  return isAdminRole(role);
}

// Check if user is a renter
export function isRenter(role: UserRole | null): boolean {
  return role === 'renter';
}

// Get appropriate home page for user role
export function getHomePageForRole(role: UserRole | null): string {
  switch (role) {
    case 'renter':
      return '/facilities-map';
    case 'staff':
    case 'manager':
    case 'coordinator':
    case 'district_approver':
    case 'site_approver':
      return '/staff';
    case 'admin':
    default:
      return '/facilities';
  }
} 