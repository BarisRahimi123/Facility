export type UserRole = 'staff' | 'manager' | 'coordinator' | 'vendor' | 'renter' | 'master_admin' | 'sub_master' | 'district_approver' | 'site_approver';

export interface Facility {
  id: string;
  name: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  department?: string;
  position?: string;
  company?: string;
  services?: string[];
  organization_id?: string;
  organization_name?: string;
  created_at: string;
  updated_at?: string;
  facilities?: Facility[];
} 