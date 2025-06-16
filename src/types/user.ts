export type UserRole = 'admin' | 'staff' | 'contractor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  skills?: string[];
  phone?: string;
  title?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
} 