// Staff Facility Assignment Types

export interface StaffFacilityAssignment {
  id: string;
  user_id: string;
  facility_id: string;
  assigned_by: string | null;
  role: StaffRole;
  permissions: StaffPermissions;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

// Staff Field Assignment Types
export interface StaffFieldAssignment {
  id: string;
  user_id: string;
  field_id: string;
  facility_id: string;
  assigned_by: string | null;
  role: StaffRole;
  permissions: StaffPermissions;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

// Staff Room Assignment Types
export interface StaffRoomAssignment {
  id: string;
  user_id: string;
  room_id: string;
  building_id: string;
  facility_id: string;
  assigned_by: string | null;
  role: StaffRole;
  permissions: StaffPermissions;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

export type StaffRole = 'staff' | 'manager' | 'coordinator';

export interface StaffPermissions {
  manage_calendar: boolean;
  create_blockouts: boolean;
  view_reservations: boolean;
  manage_reservations: boolean;
  view_reports: boolean;
}

export interface FieldBlockoutDate {
  id: string;
  field_id: string;
  created_by: string | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  start_time?: string; // HH:mm format
  end_time?: string; // HH:mm format
  reason: string;
  description?: string;
  recurring: boolean;
  recurring_pattern?: RecurringPattern;
  status: BlockoutStatus;
  created_at: string;
  updated_at: string;
}

// Room Blockout Types
export interface RoomBlockoutDate {
  id: string;
  room_id: string;
  created_by: string | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  start_time?: string; // HH:mm format
  end_time?: string; // HH:mm format
  reason: string;
  description?: string;
  recurring: boolean;
  recurring_pattern?: RecurringPattern;
  status: BlockoutStatus;
  created_at: string;
  updated_at: string;
}

export type BlockoutStatus = 'active' | 'cancelled';

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // e.g., every 2 weeks
  days_of_week?: number[]; // 0-6, Sunday=0
  end_condition: {
    type: 'never' | 'after_occurrences' | 'by_date';
    occurrences?: number;
    end_date?: string;
  };
}

// Staff Dashboard Types
export interface StaffDashboardData {
  assignments: StaffFacilityAssignment[];
  field_assignments: StaffFieldAssignment[];
  room_assignments: StaffRoomAssignment[];
  facilities: FacilityWithFields[];
  assigned_fields: FieldWithBlockouts[];
  assigned_rooms: RoomWithBlockouts[];
  upcoming_blockouts: (FieldBlockoutDate | RoomBlockoutDate)[];
  recent_reservations: any[];
}

export interface FacilityWithFields {
  id: string;
  name: string;
  address: string;
  facility_type: string;
  status: string;
  fields: FieldWithBlockouts[];
}

export interface FieldWithBlockouts {
  id: string;
  name: string;
  type: string;
  status: string;
  hourly_rate: number;
  facility_id: string;
  facility_name?: string;
  blockouts: FieldBlockoutDate[];
}

export interface RoomWithBlockouts {
  id: string;
  number: string;
  type: string;
  building_id: string;
  building_name?: string;
  facility_id: string;
  facility_name?: string;
  blockouts: RoomBlockoutDate[];
}

// Calendar View Types
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
  blockouts: (FieldBlockoutDate | RoomBlockoutDate)[];
  reservations: any[];
}

export interface CalendarEvent {
  id: string;
  type: 'blockout' | 'reservation';
  title: string;
  start: Date;
  end: Date;
  field_id?: string;
  room_id?: string;
  status: string;
  color: string;
}

// Form Types
export interface CreateBlockoutFormData {
  field_id?: string;
  room_id?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  description?: string;
  recurring: boolean;
  recurring_pattern?: RecurringPattern;
}

export interface UpdateBlockoutFormData extends Partial<CreateBlockoutFormData> {
  id: string;
  status?: BlockoutStatus;
}

// Assignment Form Types
export interface CreateFieldAssignmentFormData {
  user_id: string;
  field_id: string;
  role: StaffRole;
  permissions: StaffPermissions;
}

export interface CreateRoomAssignmentFormData {
  user_id: string;
  room_id: string;
  role: StaffRole;
  permissions: StaffPermissions;
}

// API Response Types
export interface StaffAssignmentResponse {
  data: StaffFacilityAssignment[] | null;
  error: string | null;
  count?: number;
}

export interface StaffFieldAssignmentResponse {
  data: StaffFieldAssignment[] | null;
  error: string | null;
  count?: number;
}

export interface StaffRoomAssignmentResponse {
  data: StaffRoomAssignment[] | null;
  error: string | null;
  count?: number;
}

export interface BlockoutResponse {
  data: (FieldBlockoutDate | RoomBlockoutDate)[] | null;
  error: string | null;
  count?: number;
}

export interface StaffDashboardResponse {
  data: StaffDashboardData | null;
  error: string | null;
}

// Staff Assignment Management
export interface AssignmentUser {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

export interface AssignmentField {
  id: string;
  name: string;
  type: string;
  facility_id: string;
  facility_name: string;
}

export interface AssignmentRoom {
  id: string;
  number: string;
  type: string;
  building_id: string;
  building_name: string;
  facility_id: string;
  facility_name: string;
} 