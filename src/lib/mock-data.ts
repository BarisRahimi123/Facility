import { Building, BuildingSystem, Room, BuildingType, SystemCondition, MaintenanceFrequency, BuildingSystemType } from '@/types/building';
import { Facility } from '@/types/facility';

// Global mock data store - this will persist across imports
const globalMockData = global as any;

// Initialize mock facilities if not already present
if (!globalMockData.mockFacilities) {
  globalMockData.mockFacilities = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Main Office Building',
      facility_type: 'Office',
      address: '123 Business Ave, New York, NY 10001',
      description: 'A 10-story office building with modern amenities and conference facilities.',
      status: 'active',
      square_footage: 125000,
      facility_condition_index: 92,
      rooms: 24,
      active_issues: 3,
      occupancy_rate: 98,
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Warehouse Facility',
      facility_type: 'Warehouse',
      address: '456 Industrial Pkwy, Chicago, IL 60007',
      description: 'Large warehouse with loading docks and storage facilities.',
      status: 'active',
      square_footage: 200000,
      facility_condition_index: 85,
      rooms: 5,
      active_issues: 1,
      occupancy_rate: 75,
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Central High School',
      facility_type: 'School',
      address: '789 Education Ave, Boston, MA 02108',
      description: 'Modern educational facility with classrooms, laboratories, and athletic facilities.',
      status: 'active',
      square_footage: 150000,
      facility_condition_index: 88,
      rooms: 45,
      active_issues: 2,
      occupancy_rate: 95,
      created_by: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '4',
      name: 'Memorial Hospital',
      facility_type: 'Healthcare',
      address: '101 Medical Center Dr, Houston, TX 77030',
      description: 'Full-service hospital with emergency care, surgical units, and patient rooms.',
      status: 'active',
      square_footage: 300000,
      facility_condition_index: 90,
      rooms: 200,
      active_issues: 4,
      occupancy_rate: 85,
      created_by: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '5',
      name: 'Research Center',
      facility_type: 'Laboratory',
      address: '222 Innovation Way, San Jose, CA 95110',
      description: 'Advanced research facility with specialized laboratories and testing equipment.',
      status: 'active',
      square_footage: 100000,
      facility_condition_index: 95,
      rooms: 30,
      active_issues: 1,
      occupancy_rate: 88,
      created_by: '00000000-0000-0000-0000-000000000000',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ] as Facility[];
}

export const mockFacilities = globalMockData.mockFacilities as Facility[];

export function addMockFacility(facility: Facility) {
  mockFacilities.push(facility);
}

export function getMockFacilities(): Facility[] {
  return mockFacilities;
}

export function getMockFacilityById(id: string): Facility | undefined {
  return mockFacilities.find(f => f.id === id);
}

// Mock Buildings
export const mockBuildings: Building[] = [
  {
    id: '1',
    facility_id: 'fac-1',
    name: 'Main Academic Building',
    building_number: 'A-101',
    construction_date: '1995-06-15',
    building_type: 'Classroom',
    square_footage: 45000,
    number_of_rooms: 25,
    status: 'active',
    dsa_number: 'DSA-123456',
    linked_plan_folders: ['folder-1', 'folder-2'],
    notes: 'Recently renovated HVAC system',
    created_by: 'user-1',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-03-20T10:30:00Z',
    renovations: [
      {
        date: '2023-12-01',
        scope_of_work: 'HVAC System Upgrade',
        square_footage_affected: 15000,
        start_date: '2023-12-01',
        completion_date: '2024-02-15',
        status: 'completed',
        funding_source: 'Capital Improvement Fund',
        dsa_approval_status: 'approved',
        inspector_of_record: {
          name: 'John Smith',
          contact: 'john.smith@example.com'
        },
        change_orders: [
          {
            description: 'Additional ductwork required',
            cost_adjustment: 25000,
            date: '2024-01-15'
          }
        ],
        estimated_budget: 500000,
        final_cost: 525000,
        contractor_details: {
          name: 'ABC Contractors',
          phone: '555-0123',
          email: 'contact@abccontractors.com'
        },
        architect_firm: {
          name: 'XYZ Architecture',
          contact: 'info@xyzarch.com'
        },
        project_manager: {
          name: 'Sarah Johnson',
          department: 'Facilities',
          contact: 'sarah.j@example.com'
        },
        warranties: [
          {
            item: 'HVAC Units',
            expiry_date: '2029-02-15',
            details: '5-year warranty on parts and labor'
          }
        ],
        maintenance_plan: 'Quarterly inspections required',
        notes: 'Project completed ahead of schedule',
        lessons_learned: 'Better coordination needed with existing infrastructure'
      }
    ]
  },
  {
    id: '2',
    facility_id: 'fac-1',
    name: 'Science Building',
    building_number: 'B-201',
    construction_date: '2000-08-20',
    building_type: 'Laboratory',
    square_footage: 35000,
    number_of_rooms: 18,
    status: 'active',
    created_by: 'user-1',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-03-20T10:30:00Z'
  }
];

// Mock Building Systems
export const mockBuildingSystems: BuildingSystem[] = [
  {
    id: 'sys-1',
    building_id: '1',
    system_type: 'HVAC',
    name: 'Central HVAC System',
    model: 'Carrier XR-2000',
    manufacturer: 'Carrier',
    installation_date: '2024-02-15',
    warranty_expiry: '2029-02-15',
    condition: 'Excellent',
    maintenance_schedule: 'quarterly',
    maintenance_details: {
      frequency: 'quarterly',
      day_of_month: 1,
      time: '09:00',
      description: 'Full system inspection and filter replacement'
    },
    last_maintenance_date: '2024-03-01',
    next_maintenance_date: '2024-06-01',
    status: 'operational',
    created_by: 'user-1',
    created_at: '2024-02-15T08:00:00Z',
    updated_at: '2024-03-01T10:00:00Z'
  },
  {
    id: 'sys-2',
    building_id: '1',
    system_type: 'Electrical',
    name: 'Main Electrical System',
    model: 'PowerGrid Elite',
    manufacturer: 'ElectriCorp',
    installation_date: '2024-02-15',
    warranty_expiry: '2029-02-15',
    condition: 'Good',
    maintenance_schedule: 'monthly',
    status: 'operational',
    created_by: 'user-1',
    created_at: '2024-02-15T08:00:00Z',
    updated_at: '2024-03-01T10:00:00Z'
  }
];

// Mock Rooms
export const mockRooms: Room[] = [
  {
    id: 'room-1',
    building_id: '1',
    room_number: '101',
    room_function: 'Classroom',
    square_footage: 800,
    capacity: 30,
    floor: '1',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-03-20T10:30:00Z'
  },
  {
    id: 'room-2',
    building_id: '1',
    room_number: '102',
    room_function: 'Laboratory',
    square_footage: 1200,
    capacity: 24,
    floor: '1',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-03-20T10:30:00Z'
  }
];

// Mock Plans
export const mockPlans = [
  {
    id: 'plan-1',
    name: 'First Floor Plan',
    title: 'Main Building - First Floor',
    folder_id: 'folder-1',
    sheet_number: 'A1.01',
    revision: 'Rev 2',
    scale: '1/8" = 1\'-0"',
    type: 'Architectural',
    uploaded_at: '2024-02-15T08:00:00Z',
    uploaded_by: 'user-1',
    created_at: '2024-02-15T08:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
    version: '2.0',
    status: 'active'
  },
  {
    id: 'plan-2',
    name: 'HVAC Layout',
    title: 'Main Building - HVAC System Layout',
    folder_id: 'folder-1',
    sheet_number: 'M1.01',
    revision: 'Rev 1',
    scale: '1/8" = 1\'-0"',
    type: 'Mechanical',
    uploaded_at: '2024-02-15T08:00:00Z',
    uploaded_by: 'user-1',
    created_at: '2024-02-15T08:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
    version: '1.0',
    status: 'active'
  },
  {
    id: 'plan-3',
    name: 'Electrical Layout',
    title: 'Main Building - Electrical System',
    folder_id: 'folder-2',
    sheet_number: 'E1.01',
    revision: 'Rev 1',
    scale: '1/8" = 1\'-0"',
    type: 'Electrical',
    uploaded_at: '2024-02-15T08:00:00Z',
    uploaded_by: 'user-1',
    created_at: '2024-02-15T08:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
    version: '1.0',
    status: 'active'
  }
];

// Mock Plans by Folder
export const mockPlansByFolder = {
  'folder-1': mockPlans.filter(p => p.folder_id === 'folder-1'),
  'folder-2': mockPlans.filter(p => p.folder_id === 'folder-2')
};

// Helper function to get mock data for a specific building
export function getMockBuildingData(buildingId: string) {
  const building = mockBuildings.find(b => b.id === buildingId);
  const systems = mockBuildingSystems.filter(s => s.building_id === buildingId);
  const rooms = mockRooms.filter(r => r.building_id === buildingId);
  
  return {
    building,
    systems,
    rooms
  };
} 