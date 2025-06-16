import { NextResponse } from 'next/server';
import { getAllFacilities } from '@/app/actions/facilities';

// Mock facilities data - exported for reuse in other API routes
export const mockFacilities = [
  {
    id: '1',
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
    created_by: '00000000-0000-0000-0000-000000000000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Warehouse Facility',
    facility_type: 'Warehouse',
    address: '456 Industrial Pkwy, Chicago, IL 60007',
    description: 'Large warehouse with loading docks and storage facilities for inventory management.',
    status: 'active',
    square_footage: 200000,
    facility_condition_index: 85,
    rooms: 5,
    active_issues: 1,
    occupancy_rate: 75,
    created_by: '00000000-0000-0000-0000-000000000000',
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
];

export async function GET() {
  try {
    // Use the server action to get all facilities
    const facilities = await getAllFacilities();
    return NextResponse.json(facilities);
  } catch (error) {
    console.error('Error in facilities API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // For now, just return success - the actual creation should be done through the server action
    return NextResponse.json({ message: 'Please use the server action createFacility instead' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    );
  }
} 