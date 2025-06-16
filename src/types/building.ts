// Building Types
export const BuildingTypes = {
  COMMERCIAL: 'commercial',
  RESIDENTIAL: 'residential',
  INDUSTRIAL: 'industrial',
  EDUCATIONAL: 'educational',
  HEALTHCARE: 'healthcare',
  MIXED_USE: 'mixed_use',
  OTHER: 'other',
} as const;

export type BuildingType = typeof BuildingTypes[keyof typeof BuildingTypes];

export type RoomFunction = 
  | 'Classroom'
  | 'Office'
  | 'Restroom'
  | 'Laboratory'
  | 'Storage'
  | 'Conference'
  | 'Other';

export type BuildingSystemType =
  | 'HVAC'
  | 'AC'
  | 'Electrical'
  | 'Plumbing'
  | 'Roofing'
  | 'Fire Safety'
  | 'Security'
  | 'IT Infrastructure'
  | 'Other';

export type SystemCondition =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Critical';

export type SystemStatus =
  | 'operational'
  | 'needs_maintenance'
  | 'under_maintenance'
  | 'offline'
  | 'critical';

export type MaintenanceType =
  | 'routine'
  | 'repair'
  | 'inspection'
  | 'upgrade'
  | 'emergency';

export type MaintenanceStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type MaintenanceFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually';

export interface Renovation {
  id: string;
  building_id: string;
  date?: string;
  scope_of_work: string;
  square_footage_affected: number;
  start_date: string;
  completion_date: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  budget: number;
  actual_cost: number;
  contractor_name: string;
  contractor_contact: string;
  permit_numbers?: string;
  permit_issue_date?: string;
  inspection_dates?: string;
  inspection_results?: string;
  funding_source: string;
  dsa_approval_status: 'approved' | 'pending' | 'not_required';
  inspector_of_record: {
    name: string;
    contact: string;
  };
  change_orders: {
    description: string;
    cost_adjustment: number;
    date: string;
  }[];
  estimated_budget: number;
  final_cost?: number;
  contractor_details: {
    name: string;
    phone: string;
    email: string;
  };
  architect_firm?: {
    name: string;
    contact: string;
  };
  project_manager: {
    name: string;
    department: string;
    contact: string;
  };
  warranties: {
    item: string;
    expiry_date: string;
    details: string;
  }[];
  maintenance_plan: string;
  notes?: string;
  lessons_learned?: string;
  created_at: string;
  updated_at: string;
}

export type BuildingStatus = 'active' | 'inactive' | 'maintenance';

export interface Building {
  id: string;
  facility_id: string;
  name: string;
  building_number: string;
  building_type: BuildingType;
  construction_date: string | null;
  square_footage: number;
  number_of_rooms: number;
  status: BuildingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Room {
  id: string;
  building_id: string;
  room_number: string;
  room_function: RoomFunction;
  square_footage: number;
  capacity?: number;
  floor: string;
  furniture_details?: Record<string, any>;
  accessibility_notes?: string;
  created_at: string;
  updated_at: string;
}

// System-specific interfaces
export interface HVACSystemDetails {
  cooling_capacity: number; // BTU/hr
  heating_capacity: number; // BTU/hr
  air_flow_rate: number; // CFM
  energy_efficiency: number; // SEER/EER
  refrigerant_type: string;
  zone_coverage: string[];
}

export interface ElectricalSystemDetails {
  voltage_rating: number;
  amperage_rating: number;
  phase_type: 'Single' | 'Three';
  number_of_circuits: number;
  main_breaker_size: number;
  service_type: string;
}

export interface PlumbingSystemDetails {
  pipe_material: string;
  pipe_size: string;
  water_heater_details: {
    make: string;
    model: string;
    capacity: number; // gallons
  };
  pressure_rating: number; // PSI
  backflow_prevention_type: string;
  water_source: string;
  waste_system_type: string;
}

export interface RoofingSystemDetails {
  material_type: string;
  r_value: number;
  surface_area: number; // sq ft
  drainage_system_type: string;
  last_inspection_date: string;
  expected_lifespan: number; // years
}

export interface FireSafetySystemDetails {
  number_of_zones: number;
  sprinkler_type: string;
  fire_alarm_type: string;
  monitoring_service: string;
  certification_date: string;
  inspection_frequency: string;
}

export interface SecuritySystemDetails {
  control_panel: {
    make: string;
    model: string;
  };
  camera_system: {
    make: string;
    model: string;
    number_of_cameras: number;
  };
  access_control_type: string;
  monitoring_service: string;
  backup_system_type: string;
  coverage_areas: string[];
  integration_type: string;
}

export interface ITInfrastructureDetails {
  network_equipment: {
    make: string;
    model: string;
  };
  server_types: string[];
  bandwidth_capacity: string;
  backup_systems: string[];
  ups: {
    make: string;
    model: string;
    capacity: string;
  };
  cable_category: string;
  number_of_data_points: number;
  wireless_coverage: string[];
}

export interface BuildingSystem {
  id: string;
  building_id: string;
  system_type: BuildingSystemType;
  name: string;
  model?: string;
  manufacturer?: string;
  installation_date?: string;
  warranty_expiry?: string;
  condition: SystemCondition;
  maintenance_schedule?: MaintenanceFrequency;
  maintenance_details?: {
    frequency: MaintenanceFrequency;
    day_of_week?: number; // 0-6 for weekly
    day_of_month?: number; // 1-31 for monthly
    month?: number; // 1-12 for annually
    time?: string; // HH:mm format
    description?: string;
  };
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  specifications?: {
    capacity?: string;
    coverage?: string;
    certifications?: string[];
    system_details:
      | HVACSystemDetails
      | ElectricalSystemDetails
      | PlumbingSystemDetails
      | RoofingSystemDetails
      | FireSafetySystemDetails
      | SecuritySystemDetails
      | ITInfrastructureDetails
      | Record<string, any>;
  };
  status: SystemStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SystemMaintenance {
  id: string;
  system_id: string;
  maintenance_date: string;
  maintenance_type: MaintenanceType;
  performed_by: string;
  description?: string;
  cost?: number;
  next_maintenance_date?: string;
  status: MaintenanceStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type BuildingFormData = Omit<Building, 'id' | 'created_at' | 'updated_at'>;

export interface RoomFormData {
  building_id: string;
  room_number: string;
  room_function: string;
  square_footage: number;
  capacity?: number;
  floor?: string;
} 