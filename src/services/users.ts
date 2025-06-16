'use client';

import { createClient } from '@/lib/supabase/client';
import type { User, UserInvitation, TaskAssignment, POAssignment, UserRole, AssignmentStatus } from '@/types/users';
import { sendSMS } from '@/lib/twilio';

export async function getUsers(): Promise<User[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

export async function inviteUser(invitation: Omit<UserInvitation, 'id' | 'status' | 'created_at'>): Promise<UserInvitation | null> {
  const supabase = createClient();
  try {
    // Create invitation record
    const { data: invitationData, error: invitationError } = await supabase
      .from('user_invitations')
      .insert([{
        ...invitation,
        status: 'pending'
      }])
      .select()
      .single();

    if (invitationError) throw invitationError;

    // Send SMS notification if phone number is provided
    if (invitation.phone) {
      await sendSMS(
        invitation.phone,
        `You've been invited to join FacilityCore. Click here to accept: ${process.env.NEXT_PUBLIC_APP_URL}/invite/${invitationData.id}`
      );
    }

    return invitationData;
  } catch (error) {
    console.error('Error inviting user:', error);
    return null;
  }
}

export async function assignTask(assignment: Omit<TaskAssignment, 'id' | 'status' | 'created_at'>): Promise<TaskAssignment | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('task_assignments')
      .insert([{
        ...assignment,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning task:', error);
    return null;
  }
}

export async function updateTaskAssignment(assignmentId: string, status: AssignmentStatus): Promise<TaskAssignment | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('task_assignments')
      .update({ status })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating task assignment:', error);
    return null;
  }
}

export async function assignPurchaseOrder(assignment: Omit<POAssignment, 'id' | 'status' | 'created_at'>): Promise<POAssignment | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('po_assignments')
      .insert([{
        ...assignment,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning purchase order:', error);
    return null;
  }
}

export async function updatePOAssignment(assignmentId: string, status: AssignmentStatus): Promise<POAssignment | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('po_assignments')
      .update({ status })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating PO assignment:', error);
    return null;
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function updateUserRole(userId: string, role: string): Promise<UserRole | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert([{
        user_id: userId,
        role
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user role:', error);
    return null;
  }
}

export async function getPOAssignments(poId: string): Promise<POAssignment[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('po_assignments')
      .select('*')
      .eq('po_id', poId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching PO assignments:', error);
    return [];
  }
}

// Dummy users for development
export const dummyUsers: User[] = [
  {
    id: '1',
    type: 'internal',
    name: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+1234567890',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    department: 'Engineering',
    position: 'Senior Engineer',
    employeeId: 'EMP001',
    accessLevel: 'staff',
    certifications: ['PE', 'PMP'],
  },
  {
    id: '2',
    type: 'vendor',
    name: 'ABC Construction',
    email: 'contact@abcconstruction.com',
    phone: '+1987654321',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    company: 'ABC Construction Inc.',
    services: ['Construction', 'Renovation'],
    customServices: [],
    insurance: {
      liability: true,
      workersComp: true,
      auto: true,
      umbrella: true,
    },
    permissions: [
      { area: 'projects', access: 'view' },
      { area: 'documents', access: 'view' },
    ],
    rating: 4.5,
    contractNumber: 'CNT001',
    contractStatus: 'active',
  },
  {
    id: '3',
    type: 'external',
    name: 'Sarah Johnson',
    email: 'sarah@consultancy.com',
    phone: '+1122334455',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    company: 'Expert Consultancy',
    role: 'Consultant',
    permissions: [
      { area: 'projects', access: 'view' },
      { area: 'reports', access: 'edit' },
    ],
    projectAccess: ['Project A', 'Project B'],
  },
  {
    id: '4',
    type: 'internal',
    name: 'Maria Garcia',
    email: 'maria.garcia@company.com',
    phone: '+1234567891',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    department: 'Project Management',
    position: 'Project Manager',
    employeeId: 'EMP002',
    accessLevel: 'manager',
    certifications: ['PMP', 'LEED AP'],
  },
  {
    id: '5',
    type: 'vendor',
    name: 'XYZ Electrical',
    email: 'info@xyzelectrical.com',
    phone: '+1987654322',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    company: 'XYZ Electrical Services',
    services: ['Electrical', 'Lighting', 'Solar'],
    customServices: ['EV Charging'],
    insurance: {
      liability: true,
      workersComp: true,
      auto: true,
      umbrella: true,
    },
    permissions: [
      { area: 'projects', access: 'view' },
      { area: 'documents', access: 'view' },
    ],
    rating: 4.8,
    contractNumber: 'CNT002',
    contractStatus: 'active',
  },
  {
    id: '6',
    type: 'external',
    name: 'David Lee',
    email: 'david@architectfirm.com',
    phone: '+1122334456',
    status: 'active',
    lastActive: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    company: 'Modern Architecture Inc.',
    role: 'Architect',
    permissions: [
      { area: 'projects', access: 'edit' },
      { area: 'documents', access: 'edit' },
      { area: 'plans', access: 'admin' },
    ],
    projectAccess: ['Project A', 'Project C', 'Project D'],
  },
]; 