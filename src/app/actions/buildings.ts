'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Building, Room, BuildingSystem, BuildingType, RoomFunction, BuildingSystemType, SystemCondition, MaintenanceFrequency, Renovation } from '@/types/building';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { BuildingTypes } from '@/types/building';

// Create a Supabase client with the service role key for server-side operations
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Mock data for buildings
const mockBuildings: Building[] = [
  {
    id: '1',
    facility_id: '1',
    name: 'Main Building',
    building_number: 'A-101',
    building_type: BuildingTypes.EDUCATIONAL,
    construction_date: '1985-06-15',
    square_footage: 25000,
    number_of_rooms: 30,
    status: 'active',
    notes: 'Recently renovated in 2020',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: '2',
    facility_id: '1',
    name: 'Science Building',
    building_number: 'B-201',
    building_type: BuildingTypes.EDUCATIONAL,
    construction_date: '1990-03-20',
    square_footage: 18000,
    number_of_rooms: 20,
    status: 'active',
    notes: 'Contains chemistry and physics labs',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: '3',
    facility_id: '2',
    name: 'Gymnasium',
    building_number: 'C-301',
    building_type: BuildingTypes.EDUCATIONAL,
    construction_date: '1988-09-01',
    square_footage: 30000,
    number_of_rooms: 10,
    status: 'active',
    notes: 'Includes basketball court and swimming pool',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'system'
  }
];

// Mock data for rooms
const mockRooms: Room[] = [
  {
    id: '1',
    building_id: '1',
    room_number: '101',
    room_function: 'Office',
    square_footage: 200,
    capacity: 2,
    floor: '1',
    furniture_details: {
      desks: 2,
      chairs: 4,
      cabinets: 2
    },
    accessibility_notes: 'ADA compliant',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    building_id: '1',
    room_number: '102',
    room_function: 'Conference',
    square_footage: 400,
    capacity: 12,
    floor: '1',
    furniture_details: {
      tables: 1,
      chairs: 12,
      whiteboard: 1
    },
    accessibility_notes: 'ADA compliant',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock data for building systems
const mockBuildingSystems: BuildingSystem[] = [
  {
    id: '1',
    building_id: '1',
    system_type: 'HVAC',
    name: 'Main HVAC System',
    model: 'Carrier-2000',
    manufacturer: 'Carrier',
    installation_date: '2020-01-01',
    warranty_expiry: '2025-01-01',
    condition: 'Good',
    maintenance_schedule: 'monthly',
    maintenance_details: {
      frequency: 'monthly',
      day_of_month: 1,
      time: '09:00',
      description: 'Regular maintenance check'
    },
    last_maintenance_date: '2024-01-01',
    next_maintenance_date: '2024-02-01',
    specifications: {
      capacity: '50 tons',
      coverage: 'Entire building',
      certifications: ['Energy Star'],
      system_details: {
        cooling_capacity: 600000,
        heating_capacity: 500000,
        air_flow_rate: 20000,
        energy_efficiency: 18,
        refrigerant_type: 'R-410A',
        zone_coverage: ['Floor 1', 'Floor 2']
      }
    },
    status: 'operational',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    building_id: '1',
    system_type: 'Electrical',
    name: 'Main Electrical System',
    model: 'PowerMax-5000',
    manufacturer: 'Schneider Electric',
    installation_date: '2019-01-01',
    warranty_expiry: '2024-01-01',
    condition: 'Excellent',
    maintenance_schedule: 'quarterly',
    maintenance_details: {
      frequency: 'quarterly',
      day_of_month: 15,
      time: '08:00',
      description: 'Electrical system inspection'
    },
    last_maintenance_date: '2023-12-15',
    next_maintenance_date: '2024-03-15',
    specifications: {
      capacity: '1000 kVA',
      coverage: 'Entire building',
      certifications: ['UL Listed'],
      system_details: {
        voltage_rating: 480,
        amperage_rating: 1200,
        phase_type: 'Three',
        number_of_circuits: 48,
        main_breaker_size: 1200,
        service_type: 'Underground'
      }
    },
    status: 'operational',
    created_by: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock data for renovations
const mockRenovations: Renovation[] = [
  {
    id: '1',
    building_id: '1',
    date: '2023-01-01',
    scope_of_work: 'HVAC System Upgrade',
    square_footage_affected: 5000,
    start_date: '2023-01-01',
    completion_date: '2023-03-01',
    status: 'completed',
    funding_source: 'Capital Budget',
    dsa_approval_status: 'approved',
    inspector_of_record: {
      name: 'John Smith',
      contact: '555-0123'
    },
    change_orders: [
      {
        description: 'Additional ductwork required',
        cost_adjustment: 25000,
        date: '2023-02-01'
      }
    ],
    estimated_budget: 500000,
    final_cost: 525000,
    contractor_details: {
      name: 'ABC Contractors',
      phone: '555-0124',
      email: 'contact@abccontractors.com'
    },
    architect_firm: {
      name: 'XYZ Architects',
      contact: '555-0125'
    },
    project_manager: {
      name: 'Jane Doe',
      department: 'Facilities',
      contact: '555-0126'
    },
    warranties: [
      {
        item: 'HVAC Units',
        expiry_date: '2028-01-01',
        details: '5-year parts and labor warranty'
      }
    ],
    maintenance_plan: 'Quarterly inspections and annual comprehensive service',
    notes: 'Project completed on schedule',
    lessons_learned: 'Better coordination needed with occupants during installation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Initialize in-memory storage
let inMemoryBuildings: Building[] = [...mockBuildings];
let inMemoryRooms: Room[] = [...mockRooms];
let inMemoryBuildingSystems: BuildingSystem[] = [...mockBuildingSystems];
let inMemoryRenovations: Renovation[] = [...mockRenovations];

export async function createBuilding(formData: FormData): Promise<void> {
  try {
    // Get and validate form data
    const name = formData.get('name');
    const buildingNumber = formData.get('buildingNumber');
    const constructionDate = formData.get('constructionDate');
    const buildingType = formData.get('buildingType');
    const squareFootage = formData.get('squareFootage');
    const numberOfRooms = formData.get('numberOfRooms') || '0';
    const facilityId = formData.get('facilityId');
    const notes = formData.get('notes');

    // Validate required fields
    if (!name || !buildingType || !squareFootage || !constructionDate || !facilityId) {
      throw new Error('Missing required fields');
    }

    console.log('Creating building with data:', {
      name: name.toString(),
      facilityId: facilityId.toString(),
      buildingType: buildingType.toString()
    });

    // Prepare building data
    const buildingData = {
      facility_id: facilityId.toString(),
      name: name.toString(),
      building_number: buildingNumber?.toString() || null,
      construction_date: new Date(constructionDate.toString()).toISOString().split('T')[0],
      building_type: buildingType.toString() as BuildingType,
      square_footage: parseFloat(squareFootage.toString()),
      number_of_rooms: parseInt(numberOfRooms.toString(), 10),
      status: 'active' as const,
      notes: notes?.toString() || null,
      created_by: null, // Use null to avoid foreign key constraint
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try to use service role client for direct database access
    try {
      console.log('Attempting to create building in database...');
      
      const { data, error } = await serviceRoleClient
        .from('buildings')
        .insert([buildingData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Building created successfully in database:', data);
      
      // Revalidate the facility page to show the new building
      revalidatePath(`/facility/${facilityId}`);
      return;
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // Fall back to in-memory storage
      console.log('Using in-memory storage as fallback');
      const inMemoryBuilding: Building = {
        id: `building_${Date.now()}`,
        facility_id: facilityId.toString(),
        name: name.toString(),
        building_number: buildingNumber?.toString() || undefined,
        construction_date: new Date(constructionDate.toString()).toISOString().split('T')[0],
        building_type: buildingType.toString() as BuildingType,
        square_footage: parseFloat(squareFootage.toString()),
        number_of_rooms: parseInt(numberOfRooms.toString(), 10),
        status: 'active',
        notes: notes?.toString() || null,
        created_by: 'mock-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rooms: [],
        building_systems: [],
        renovations: []
      };

      inMemoryBuildings.push(inMemoryBuilding);
      console.log('Building created successfully in memory:', inMemoryBuilding);
      
      // Revalidate the facility page
      revalidatePath(`/facility/${facilityId}`);
    }
    
  } catch (error) {
    console.error('Error in createBuilding:', error);
    throw error;
  }
}

export async function createRoom(formData: FormData): Promise<void> {
  try {
    const buildingId = formData.get('building_id')?.toString();
    
    // Validate required fields - using correct field names with underscores
    const roomNumber = formData.get('room_number')?.toString();
    const roomFunction = formData.get('room_function')?.toString();
    const squareFootage = formData.get('square_footage')?.toString();
    const floor = formData.get('floor')?.toString();
    const capacity = formData.get('capacity')?.toString();

    if (!roomNumber || !roomFunction || !squareFootage || !buildingId) {
      throw new Error('Missing required fields: room_number, room_function, square_footage, and building_id are required');
    }

    console.log('Creating room with data:', {
      building_id: buildingId,
      room_number: roomNumber,
      room_function: roomFunction,
      square_footage: squareFootage,
      floor: floor,
      capacity: capacity
    });

    // Create room data with only the columns that exist
    const roomData: any = {
      building_id: buildingId,
      name: roomNumber, // Required old column - use room_number as name
      room_number: roomNumber, // New column
      room_function: roomFunction, // New column
      square_footage: parseInt(squareFootage),
      floor: floor || null
      // Note: created_by column doesn't exist in the rooms table
    };

    // Only add capacity if it's provided and not empty
    if (capacity && capacity.trim() !== '') {
      roomData.capacity = parseInt(capacity);
    }

    // Use service role client to bypass RLS
    const { data, error } = await serviceRoleClient
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create room: ' + error.message);
    }

    console.log('Room created successfully:', data);
  } catch (error) {
    console.error('Error in createRoom:', error);
    throw error;
  }
}

export async function updateBuilding(buildingId: string, formData: FormData): Promise<void> {
  try {
    console.log('Updating building with ID:', buildingId);

    // Validate required fields
    const name = formData.get('name')?.toString();
    const buildingType = formData.get('building_type')?.toString();
    const squareFootage = formData.get('square_footage')?.toString();

    if (!name || !buildingType || !squareFootage) {
      throw new Error('Missing required fields: name, building_type, and square_footage are required');
    }

    const buildingData: any = {
      name: name,
      building_number: formData.get('building_number')?.toString() || null,
      building_type: buildingType,
      square_footage: parseInt(squareFootage),
      construction_date: formData.get('construction_date')?.toString() || null,
      year_built: formData.get('year_built') ? parseInt(formData.get('year_built') as string) : null,
      notes: formData.get('notes')?.toString() || null,
      updated_at: new Date().toISOString()
    };

    console.log('Building data to update:', buildingData);

    // Update in database using service role client
    const { data, error } = await serviceRoleClient
      .from('buildings')
      .update(buildingData)
      .eq('id', buildingId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update building: ' + error.message);
    }
    
    console.log('Building updated successfully in database:', data);
  } catch (error) {
    console.error('Error in updateBuilding:', error);
    throw error;
  }
}

export async function updateRoom(roomId: string, formData: FormData): Promise<void> {
  try {
    // Validate required fields - using correct field names with underscores
    const roomNumber = formData.get('room_number')?.toString();
    const roomFunction = formData.get('room_function')?.toString();
    const squareFootage = formData.get('square_footage')?.toString();
    const floor = formData.get('floor')?.toString();
    const capacity = formData.get('capacity')?.toString();

    if (!roomNumber || !roomFunction || !squareFootage) {
      throw new Error('Missing required fields: room_number, room_function, and square_footage are required');
    }

    console.log('Updating room with data:', {
      id: roomId,
      room_number: roomNumber,
      room_function: roomFunction,
      square_footage: squareFootage,
      floor: floor,
      capacity: capacity
    });

    // Update room data
    const roomData: any = {
      name: roomNumber, // Required old column - use room_number as name
      room_number: roomNumber,
      room_function: roomFunction,
      square_footage: parseInt(squareFootage),
      floor: floor || null,
      updated_at: new Date().toISOString()
    };

    // Only add capacity if it's provided and not empty
    if (capacity && capacity.trim() !== '') {
      roomData.capacity = parseInt(capacity);
    }

    // Use service role client to bypass RLS
    const { data, error } = await serviceRoleClient
      .from('rooms')
      .update(roomData)
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to update room: ' + error.message);
    }
    
    console.log('Room updated successfully:', data);
  } catch (error) {
    console.error('Error in updateRoom:', error);
    throw error;
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  try {
    console.log('Deleting room with ID:', roomId);

    // Use service role client to bypass RLS
    const { error } = await serviceRoleClient
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete room: ' + error.message);
    }

    console.log('Room deleted successfully');
  } catch (error) {
    console.error('Error in deleteRoom:', error);
    throw error;
  }
}

export async function updateBuildingSystem(systemId: string, formData: FormData): Promise<void> {
  try {
    const buildingId = formData.get('buildingId')?.toString();
    
    if (!buildingId) {
      throw new Error('Building ID is required');
    }

    // Get maintenance schedule details
    const maintenanceSchedule = formData.get('maintenanceSchedule')?.toString();
    const maintenanceDetails = {
      frequency: maintenanceSchedule,
      description: formData.get('maintenanceDescription')?.toString() || ''
    };

    // Validate required fields
    const systemType = formData.get('systemType')?.toString();
    const name = formData.get('name')?.toString();
    const installationDate = formData.get('installationDate')?.toString();
    const condition = formData.get('condition')?.toString();

    if (!systemType || !name || !installationDate || !condition || !maintenanceSchedule) {
      throw new Error('Missing required fields');
    }

    // Get contact information for maintenance reminders
    const contactInfo = {
      name: formData.get('contactName')?.toString() || null,
      email: formData.get('contactEmail')?.toString() || null,
      phone: formData.get('contactPhone')?.toString() || null,
      company: formData.get('contactCompany')?.toString() || null
    };

    const systemData: any = {
      building_id: buildingId,
      system_type: systemType,
      name: name,
      model: formData.get('model')?.toString() || null,
      manufacturer: formData.get('manufacturer')?.toString() || null,
      installation_date: installationDate,
      warranty_expiry: formData.get('warrantyExpiry')?.toString() || null,
      condition: condition,
      maintenance_schedule: maintenanceSchedule,
      maintenance_details: maintenanceDetails,
      last_maintenance_date: formData.get('lastMaintenanceDate')?.toString() || null,
      next_maintenance_date: formData.get('nextMaintenanceDate')?.toString() || null,
      status: 'operational',
      updated_at: new Date().toISOString()
    };

    // Try to include maintenance_contact - will fail silently if column doesn't exist
    const systemDataWithContact = {
      ...systemData,
      maintenance_contact: contactInfo
    };

    // Try to update in database
    try {
      // First try with maintenance_contact
      const { data, error } = await serviceRoleClient
        .from('building_systems')
        .update(systemDataWithContact)
        .eq('id', systemId)
        .select()
        .single();

      if (error) {
        // If error mentions maintenance_contact column, retry without it
        if (error.message?.includes('maintenance_contact')) {
          console.log('Maintenance contact column not found, retrying without it...');
          const { data: retryData, error: retryError } = await serviceRoleClient
            .from('building_systems')
            .update(systemData)
            .eq('id', systemId)
            .select()
            .single();
            
          if (retryError) {
            throw retryError;
          }
          
          console.log('Building system updated successfully (without contact info)');
          return;
        }
        throw error;
      }

      console.log('Building system updated successfully in database with contact info:', {
        id: data?.id,
        name: data?.name,
        maintenance_contact: data?.maintenance_contact
      });
    } catch (dbError) {
      console.error('Database update failed:', dbError);
      throw new Error('Failed to update building system');
    }
  } catch (error) {
    console.error('Error in updateBuildingSystem:', error);
    throw error;
  }
}

export async function deleteBuildingSystem(systemId: string): Promise<void> {
  try {
    console.log('Deleting building system with ID:', systemId);

    // Use service role client to bypass RLS
    const { error } = await serviceRoleClient
      .from('building_systems')
      .delete()
      .eq('id', systemId);

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete building system: ' + error.message);
    }

    console.log('Building system deleted successfully');
  } catch (error) {
    console.error('Error in deleteBuildingSystem:', error);
    throw error;
  }
}

export async function updateRenovation(renovationId: string, formData: FormData): Promise<void> {
  try {
    const buildingId = formData.get('buildingId')?.toString();
    
    if (!buildingId) {
      throw new Error('Building ID is required');
    }

    const scopeOfWork = formData.get('scope_of_work')?.toString() || '';
    const squareFootageAffected = Number(formData.get('square_footage_affected')) || 0;
    const startDate = formData.get('start_date')?.toString() || '';
    const completionDate = formData.get('completion_date')?.toString() || null;
    const status = formData.get('status')?.toString() || 'planning';
    const estimatedBudget = Number(formData.get('estimated_budget')) || 0;
    const actualCost = formData.get('actual_cost') ? Number(formData.get('actual_cost')) : null;
    const contractorName = formData.get('contractor_name')?.toString() || null;
    const contractorContact = formData.get('contractor_contact')?.toString() || null;
    const permitNumbers = formData.get('permit_numbers')?.toString() || null;
    const notes = formData.get('notes')?.toString() || null;
    const fundingSource = formData.get('funding_source')?.toString() || 'capital_budget';
    const dsaApprovalStatus = formData.get('dsa_approval_status')?.toString() || 'not_required';
    const architectName = formData.get('architect_name')?.toString() || null;
    const projectManagerName = formData.get('project_manager_name')?.toString() || null;

    const renovationData = {
      building_id: buildingId,
      scope_of_work: scopeOfWork,
      square_footage_affected: squareFootageAffected,
      start_date: startDate,
      completion_date: completionDate,
      status: status,
      budget: estimatedBudget,
      actual_cost: actualCost,
      contractor_name: contractorName,
      contractor_contact: contractorContact,
      permit_numbers: permitNumbers,
      notes: notes,
      funding_source: fundingSource,
      dsa_approval_status: dsaApprovalStatus,
      estimated_budget: estimatedBudget,
      architect_firm: architectName ? { name: architectName } : null,
      project_manager: projectManagerName ? { name: projectManagerName } : null,
        updated_at: new Date().toISOString()
      };

    // Try to update in database
    try {
      const { data, error } = await serviceRoleClient
        .from('renovations')
        .update(renovationData)
        .eq('id', renovationId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Renovation updated successfully in database:', data);
    } catch (dbError) {
      console.error('Database update failed, renovation may not exist in database:', dbError);
      throw new Error('Failed to update renovation');
    }
  } catch (error) {
    console.error('Error in updateRenovation:', error);
    throw error;
  }
}

export async function deleteRenovation(renovationId: string): Promise<void> {
  try {
    console.log('Deleting renovation with ID:', renovationId);

    // Use service role client to bypass RLS
    const { error } = await serviceRoleClient
      .from('renovations')
      .delete()
      .eq('id', renovationId);

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to delete renovation: ' + error.message);
    }

    console.log('Renovation deleted successfully');
  } catch (error) {
    console.error('Error in deleteRenovation:', error);
    throw error;
  }
}

export async function createBuildingSystem(formData: FormData): Promise<void> {
  try {
    const buildingId = formData.get('buildingId')?.toString();
    
    if (!buildingId) {
      throw new Error('Building ID is required');
    }

    // Get maintenance schedule details
    const maintenanceSchedule = formData.get('maintenanceSchedule')?.toString();
    const maintenanceDetails = {
      frequency: maintenanceSchedule,
      description: formData.get('maintenanceDescription')?.toString() || ''
    };

    // Get contact information for maintenance reminders
    const contactInfo = {
      name: formData.get('contactName')?.toString() || null,
      email: formData.get('contactEmail')?.toString() || null,
      phone: formData.get('contactPhone')?.toString() || null,
      company: formData.get('contactCompany')?.toString() || null
    };

    // Validate required fields
    const systemType = formData.get('systemType')?.toString();
    const name = formData.get('name')?.toString();
    const installationDate = formData.get('installationDate')?.toString();
    const condition = formData.get('condition')?.toString();

    if (!systemType || !name || !installationDate || !condition || !maintenanceSchedule) {
      throw new Error('Missing required fields');
    }

    const systemData: any = {
      building_id: buildingId,
      system_type: systemType,
      name: name,
      model: formData.get('model')?.toString() || null,
      manufacturer: formData.get('manufacturer')?.toString() || null,
      installation_date: installationDate,
      warranty_expiry: formData.get('warrantyExpiry')?.toString() || null,
      condition: condition,
      maintenance_schedule: maintenanceSchedule,
      maintenance_details: maintenanceDetails,
      last_maintenance_date: formData.get('lastMaintenanceDate')?.toString() || null,
      next_maintenance_date: formData.get('nextMaintenanceDate')?.toString() || null,
      status: 'operational'
    };

    // Try to include maintenance_contact - will fail silently if column doesn't exist
    const systemDataWithContact = {
      ...systemData,
      maintenance_contact: contactInfo
    };

    // Save to database
    // First try with maintenance_contact
    let { data, error } = await serviceRoleClient
      .from('building_systems')
      .insert([systemDataWithContact])
      .select()
      .single();

    if (error) {
      // If error mentions maintenance_contact column, retry without it
      if (error.message?.includes('maintenance_contact')) {
        console.log('Maintenance contact column not found, retrying without it...');
        const retryResult = await serviceRoleClient
          .from('building_systems')
          .insert([systemData])
          .select()
          .single();
          
        if (retryResult.error) {
          console.error('Database error creating building system:', retryResult.error);
          throw new Error('Failed to create building system: ' + retryResult.error.message);
        }
        
        console.log('Building system created successfully (without contact info)');
        return;
      }
      
      console.error('Database error creating building system:', error);
      throw new Error('Failed to create building system: ' + error.message);
    }
    
    console.log('Building system created successfully in database with contact info:', {
      id: data?.id,
      name: data?.name,
      maintenance_contact: data?.maintenance_contact
    });
  } catch (error) {
    console.error('Error in createBuildingSystem:', error);
    throw error;
  }
}



export async function getBuildings(): Promise<Building[]> {
  try {
    console.log('Fetching all buildings from database...');
    
    // Use service role client for direct database access
    const { data, error } = await serviceRoleClient
      .from('buildings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching buildings from Supabase:', error);
      // Return mock data as fallback
      return prepareMockBuildingsData();
    }

    if (!data || data.length === 0) {
      console.log('No buildings found in database, returning mock data');
      return prepareMockBuildingsData();
    }

    console.log(`Found ${data.length} buildings in database`);
    return data;
  } catch (error) {
    console.error('Unexpected error in getBuildings:', error);
    // Return mock data as fallback
    return prepareMockBuildingsData();
  }
}

// Helper function to prepare mock data with relationships
function prepareMockBuildingsData(): Building[] {
  return inMemoryBuildings.map(building => {
    // Create an extended building object with additional properties
    const extendedBuilding: any = {
      ...building,
      rooms: inMemoryRooms.filter(room => room.building_id === building.id),
      building_systems: inMemoryBuildingSystems.filter(system => system.building_id === building.id),
      renovations: inMemoryRenovations.filter(renovation => renovation.building_id === building.id)
    };
    return extendedBuilding;
  });
}

export async function getBuilding(id: string): Promise<Building | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockBuildings.find(b => b.id === id) || null;
}

export async function getBuildingRooms(buildingId: string): Promise<Room[]> {
  const building = await getBuilding(buildingId);
  return inMemoryRooms.filter(room => room.building_id === buildingId);
}

export async function getRooms(buildingId: string): Promise<Room[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return inMemoryRooms.filter(room => room.building_id === buildingId);
}

export async function getBuildingSystems(buildingId: string): Promise<any[]> {
  try {
    console.log('Fetching building systems for building:', buildingId);
    
    // Try to fetch from database first
    const { data: systems, error } = await serviceRoleClient
      .from('building_systems')
      .select('*')
      .eq('building_id', buildingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching building systems from database:', error);
      // Fall back to in-memory storage
  return inMemoryBuildingSystems.filter(system => system.building_id === buildingId);
    }

    console.log(`Found ${systems?.length || 0} building systems in database`);
    return systems || [];
  } catch (error) {
    console.error('Error in getBuildingSystems:', error);
    // Fall back to in-memory storage
    return inMemoryBuildingSystems.filter(system => system.building_id === buildingId);
  }
}

export async function seedDummyData() {
  // Sample buildings
  inMemoryBuildings = mockBuildings;

  // Sample rooms
  const rooms: Room[] = [
    {
      id: '1',
      building_id: '1',
      room_number: '101',
      room_function: 'Classroom',
      square_footage: 800,
      capacity: 30,
      floor: '1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  inMemoryRooms = rooms;
  return { message: 'Dummy data seeded successfully' };
}

export async function createRenovation(buildingId: string, formData: FormData): Promise<void> {
  try {
    const scopeOfWork = formData.get('scope_of_work')?.toString() || '';
    const squareFootageAffected = Number(formData.get('square_footage_affected')) || 0;
    const startDate = formData.get('start_date')?.toString() || '';
    const completionDate = formData.get('completion_date')?.toString() || null;
    const status = formData.get('status')?.toString() || 'planning';
    const estimatedBudget = Number(formData.get('estimated_budget')) || 0;
    const actualCost = formData.get('actual_cost') ? Number(formData.get('actual_cost')) : null;
    const contractorName = formData.get('contractor_name')?.toString() || null;
    const contractorContact = formData.get('contractor_contact')?.toString() || null;
    const permitNumbers = formData.get('permit_numbers')?.toString() || null;
    const notes = formData.get('notes')?.toString() || null;
    const fundingSource = formData.get('funding_source')?.toString() || 'capital_budget';
    const dsaApprovalStatus = formData.get('dsa_approval_status')?.toString() || 'not_required';
    const architectName = formData.get('architect_name')?.toString() || null;
    const projectManagerName = formData.get('project_manager_name')?.toString() || null;

    const renovationData = {
      building_id: buildingId,
      scope_of_work: scopeOfWork,
      square_footage_affected: squareFootageAffected,
      start_date: startDate,
      completion_date: completionDate,
      status: status,
      budget: estimatedBudget,
      actual_cost: actualCost,
      contractor_name: contractorName,
      contractor_contact: contractorContact,
      permit_numbers: permitNumbers,
      notes: notes,
      funding_source: fundingSource,
      dsa_approval_status: dsaApprovalStatus,
      estimated_budget: estimatedBudget,
      architect_firm: architectName ? { name: architectName } : null,
      project_manager: projectManagerName ? { name: projectManagerName } : null
    };

    // Try to save to database
    try {
      const { data, error } = await serviceRoleClient
        .from('renovations')
        .insert([renovationData])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        // Fall back to in-memory storage
        throw error;
      }

      console.log('Renovation created successfully in database:', data);
    } catch (dbError) {
      // Fall back to in-memory storage
      console.log('Database table not available, using in-memory storage');
      const inMemoryRenovation = {
        id: Date.now().toString(),
        ...renovationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryRenovations.push(inMemoryRenovation as any);
      console.log('Renovation created successfully in memory:', inMemoryRenovation);
    }
  } catch (error) {
    console.error('Error in createRenovation:', error);
    throw error;
  }
}



export async function getRenovations(buildingId: string): Promise<any[]> {
  return inMemoryRenovations.filter(renovation => renovation.building_id === buildingId);
} 