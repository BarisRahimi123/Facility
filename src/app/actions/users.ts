'use server';

import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types/user';
import { Organization } from '@/types/organization';
// import * as Sentry from "@sentry/nextjs";

// Temporarily disable Sentry to fix login issues
// Sentry.init({
//   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   
//   // Adjust this value in production, or use tracesSampler for greater control
//   tracesSampleRate: 1,
//   
//   // Setting this option to true will print useful information to the console while you're setting up Sentry.
//   debug: false,
//   
//   replaysOnErrorSampleRate: 1.0,
//   
//   // This sets the sample rate to be 10%. You may want this to be 100% while
//   // in development and sample at a lower rate in production
//   replaysSessionSampleRate: 0.1,
//   
//   // You can remove this option if you're not planning to use the Sentry Session Replay feature:
//   integrations: [
//     Sentry.replayIntegration({
//       // Additional Replay configuration goes in here, for example:
//       maskAllText: true,
//       blockAllMedia: true,
//     }),
//   ],
// });

export interface CreateUserData {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  department?: string;
  position?: string;
  company?: string;
  services?: string[];
  organization_id?: string;
  organization_name?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: string;
  position?: string;
  company?: string;
  services?: string[];
  organization_id?: string;
  organization_name?: string;
  facilities?: { id: string; name: string; status: string; }[];
}

export interface CreateOrganizationData {
  type: 'district' | 'school' | 'renter';
  subtype?: 'individual' | 'commercial' | 'nonprofit';
  name: string;
  display_name?: string;
  tax_id?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  billing_email?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  requires_insurance?: boolean;
  minimum_liability_coverage?: number;
  payment_terms?: string;
  notes?: string;
}

interface UserResponse {
  data: User[] | User | null;
  error: string | null;
}

interface OrganizationResponse {
  data: Organization[] | Organization | null;
  error: string | null;
}

// Get all users
export async function getUsers(): Promise<UserResponse> {
  try {
    // Use service role client to bypass authentication
    const { getServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as User[], error: null };
  } catch (error) {
    console.error('Error in getUsers:', error);
    return { data: null, error: 'Failed to fetch users' };
  }
}

// Get users by role type (for filtering)
export async function getUsersByRole(role: UserRole): Promise<UserResponse> {
  try {
    // Use service role client to bypass authentication
    const { getServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as User[], error: null };
  } catch (error) {
    console.error('Error in getUsersByRole:', error);
    return { data: null, error: 'Failed to fetch users by role' };
  }
}

// Get staff users (for assignment dropdowns)
export async function getStaffUsers(): Promise<UserResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['staff', 'manager', 'coordinator'])
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching staff users:', error);
      return { data: null, error: error.message };
    }

    return { data: data as User[], error: null };
  } catch (error) {
    console.error('Error in getStaffUsers:', error);
    return { data: null, error: 'Failed to fetch staff users' };
  }
}

// Create a new user
export async function createUser(userData: CreateUserData): Promise<UserResponse> {
  try {
    const supabase = createClient();
    
    // For renters, send invitation instead of creating directly
    if (userData.role === 'renter') {
      // Get current user to be the inviter
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Get current user's role from database
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!currentUser || !['master_admin', 'sub_admin'].includes(currentUser.role)) {
        return { data: null, error: 'You do not have permission to invite renters' };
      }

      // Create invitation for renter
      const { data: invitationData, error: invitationError } = await supabase.rpc('send_user_invitation', {
        p_email: userData.email,
        p_role: userData.role,
        p_invited_by: user.id,
        p_organization_id: userData.organization_id || null,
        p_metadata: {
          fullName: userData.full_name,
          phone: userData.phone,
          organizationId: userData.organization_id,
          organizationName: userData.organization_name
        }
      });

      if (invitationError) {
        // Check if the error is due to missing database functions
        if (invitationError.message?.includes('function') && invitationError.message?.includes('does not exist')) {
          return { data: null, error: 'Invitation system not configured. Please apply database updates first.' };
        }
        return { data: null, error: invitationError.message };
      }

      // Return invitation data as if it were user data for consistency
      return { 
        data: {
          id: invitationData.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
          is_active: false, // Will be activated when invitation is accepted
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: userData.organization_id,
          organization_name: userData.organization_name
        } as User, 
        error: null 
      };
    }

    // For non-renters, create directly as before
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return { data: data as User, error: null };
  } catch (error) {
    console.error('Error in createUser:', error);
    return { data: null, error: 'Failed to create user' };
  }
}

// Update a user
export async function updateUser(userId: string, updates: Partial<CreateUserData>): Promise<UserResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return { data: null, error: error.message };
    }

    return { data: data as User, error: null };
  } catch (error) {
    console.error('Error in updateUser:', error);
    return { data: null, error: 'Failed to update user' };
  }
}

// Delete a user
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return { error: 'Failed to delete user' };
  }
}

// Get a single user by ID
export async function getUserById(userId: string): Promise<UserResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return { data: null, error: error.message };
    }

    return { data: data as User, error: null };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return { data: null, error: 'Failed to fetch user' };
  }
}

// Check if users table exists
export async function checkUsersTableExists(): Promise<boolean> {
  try {
    // Use service role client to bypass authentication
    const { getServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = getServiceRoleClient();
    
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking users table:', { message: error.message });
      return false;
    }
    
    return count !== null;
  } catch (error) {
    console.error('Error checking users table:', { message: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

// Create sample users for testing
export async function createSampleUsers(): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const sampleUsers = [
      {
        email: 'staff@example.com',
        full_name: 'John Staff',
        role: 'staff' as UserRole,
        phone: '555-0101',
        department: 'Operations',
        position: 'Staff Member',
        is_active: true
      },
      {
        email: 'manager@example.com',
        full_name: 'Jane Manager',
        role: 'manager' as UserRole,
        phone: '555-0102',
        department: 'Facilities',
        position: 'Facility Manager',
        is_active: true
      },
      {
        email: 'coordinator@example.com',
        full_name: 'Chris Coordinator',
        role: 'coordinator' as UserRole,
        phone: '555-0103',
        department: 'Events',
        position: 'Event Coordinator',
        is_active: true
      },
      {
        email: 'vendor@example.com',
        full_name: 'Victor Vendor',
        role: 'vendor' as UserRole,
        phone: '555-0104',
        company: 'ABC Services',
        services: ['Plumbing', 'Electrical', 'HVAC'],
        is_active: true
      }
    ];

    const { error } = await supabase
      .from('users')
      .insert(sampleUsers);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error creating sample users:', error);
    return { error: 'Failed to create sample users' };
  }
}

// ORGANIZATION MANAGEMENT FUNCTIONS

// Get all organizations
export async function getOrganizations(): Promise<OrganizationResponse> {
  try {
    // Use service role client to bypass authentication
    const { getServiceRoleClient } = await import('@/lib/supabase/server');
    const supabase = getServiceRoleClient();
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as Organization[], error: null };
  } catch (error) {
    console.error('Error in getOrganizations:', error);
    return { data: null, error: 'Failed to fetch organizations' };
  }
}

// Get organizations by type
export async function getOrganizationsByType(type: string): Promise<OrganizationResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data as Organization[], error: null };
  } catch (error) {
    console.error('Error in getOrganizationsByType:', error);
    return { data: null, error: 'Failed to fetch organizations by type' };
  }
}

// Create a new organization
export async function createOrganization(orgData: CreateOrganizationData): Promise<OrganizationResponse> {
  try {
    const supabase = createClient();

    // Check if organization with name already exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('name')
      .eq('name', orgData.name)
      .single();

    if (existingOrg) {
      return { data: null, error: 'Organization with this name already exists' };
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          ...orgData,
          country: 'US',
          is_active: true,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization, error: null };
  } catch (error) {
    console.error('Error in createOrganization:', error);
    return { data: null, error: 'Failed to create organization' };
  }
}

// Update an organization
export async function updateOrganization(orgId: string, updates: Partial<CreateOrganizationData>): Promise<OrganizationResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Organization, error: null };
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    return { data: null, error: 'Failed to update organization' };
  }
}

// Delete an organization
export async function deleteOrganization(orgId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
    return { error: 'Failed to delete organization' };
  }
}

// Get users for a specific organization
export async function getUsersByOrganization(organizationId: string): Promise<UserResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        organizations (
          name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users by organization:', error);
      return { data: null, error: error.message };
    }

    // Transform data to include organization_name
    const usersWithOrgNames = data?.map((user: any) => ({
      ...user,
      organization_name: user.organizations?.name || null
    })) || [];

    return { data: usersWithOrgNames as User[], error: null };
  } catch (error) {
    console.error('Error in getUsersByOrganization:', error);
    return { data: null, error: 'Failed to fetch users by organization' };
  }
} 