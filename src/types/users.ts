export type UserRole = 'internal' | 'external' | 'admin';
export type AssignmentRole = 'assignee' | 'observer' | 'approver';
export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

export interface InternalUser extends BaseUser {
  type: 'internal';
  role: 'admin' | 'staff';
  department: string;
  position: string;
  employeeId: string;
  skills: string[];
  accessLevel: 'staff' | 'manager' | 'admin';
  certifications: string[];
}

export interface ExternalUser extends BaseUser {
  type: 'external';
  role: 'contractor' | 'consultant';
  company: string;
  permissions: Array<{
    area: string;
    access: 'view' | 'edit' | 'admin';
  }>;
  projectAccess: string[];
}

export interface VendorUser extends BaseUser {
  type: 'vendor';
  company: string;
  services: string[];
  customServices: string[];
  insurance: {
    liability: boolean;
    workersComp: boolean;
    auto: boolean;
    umbrella: boolean;
  };
  permissions: Array<{
    area: string;
    access: 'view' | 'edit' | 'admin';
  }>;
  rating: number;
  contractNumber: string;
  contractStatus: 'active' | 'inactive' | 'pending';
}

export type User = InternalUser | ExternalUser | VendorUser;

export interface UserInvitation {
  id: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff' | 'contractor' | 'consultant';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  created_by: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  userId?: string;
  email?: string;
  phone?: string;
  role: 'assignee' | 'observer';
  status: AssignmentStatus;
  createdAt: string;
  created_by: string;
}

export interface POAssignment {
  id: string;
  poId: string;
  userId?: string;
  email?: string;
  phone?: string;
  role: 'assignee' | 'approver' | 'observer';
  status: AssignmentStatus;
  createdAt: string;
  created_by: string;
  user?: User;
} 