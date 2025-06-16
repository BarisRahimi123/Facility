export const FacilityTypes = {
  ELEMENTARY_SCHOOL: 'Elementary School',
  MIDDLE_SCHOOL: 'Middle School',
  HIGH_SCHOOL: 'High School',
  ADMIN_BUILDING: 'Admin Building',
  LIBRARY: 'Library',
  GYMNASIUM: 'Gymnasium',
  CAFETERIA: 'Cafeteria',
  AUDITORIUM: 'Auditorium',
  LABORATORY: 'Laboratory',
  OFFICE: 'Office',
  HOSPITAL: 'Hospital',
  WAREHOUSE: 'Warehouse',
  COMMERCIAL: 'Commercial',
  SCHOOL: 'School',
  OTHER: 'Other',
} as const;

export type FacilityType = typeof FacilityTypes[keyof typeof FacilityTypes];

export type FacilityStatus = 'active' | 'inactive' | 'maintenance';

export interface Facility {
  id: string;
  name: string;
  facility_type: FacilityType;
  address: string;
  description?: string;
  square_footage: number;
  number_of_floors?: number;
  year_built?: string;
  last_renovation_date?: string;
  facility_condition_index: number;
  status: FacilityStatus;
  rooms?: number;
  active_issues?: number;
  occupancy_rate?: number;
  matterport_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FacilityFormData {
  name: string;
  facility_type: FacilityType;
  address: string;
  total_square_footage: number;
  number_of_floors?: number;
  year_built: string;
  last_renovation_date?: string;
  facility_condition_index: number;
  status?: FacilityStatus;
  created_by?: string;
}

export type NewFacility = Omit<Facility, 'id' | 'created_by' | 'created_at' | 'updated_at'>;

export type SystemType = 
  | 'HVAC'
  | 'Electrical'
  | 'Plumbing'
  | 'Fire Safety'
  | 'Security'
  | 'Elevator'
  | 'Building Automation'
  | 'Other';

export type MaintenanceFrequency = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

export type SystemStatus = 
  | 'operational'
  | 'needs-maintenance'
  | 'under-maintenance'
  | 'offline'
  | 'critical';

export type MaintenanceRecord = {
  id: string;
  date: string;
  type: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  performed_by: string;
  cost?: number;
  parts_used?: string[];
  next_maintenance_date?: string;
  status: 'completed' | 'scheduled' | 'in-progress' | 'cancelled';
};

export type FacilitySystem = {
  id: string;
  type: SystemType;
  name: string;
  description: string;
  location: string;
  manufacturer: string;
  model_number: string;
  serial_number?: string;
  installation_date: string;
  warranty_expiration?: string;
  maintenance_frequency: MaintenanceFrequency;
  last_maintenance: string;
  next_maintenance: string;
  status: SystemStatus;
  responsible_personnel: string[];
  specifications: Record<string, string>;
  documents?: string[];
  notes?: string;
  maintenance_history: MaintenanceRecord[];
};

export type FacilitySystemFormData = Omit<FacilitySystem, 'id' | 'maintenance_history'>; 