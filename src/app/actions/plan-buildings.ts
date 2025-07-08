'use server';

export interface PlanRoom {
  id: string;
  name: string;
  number: string;
  floor: string;
  type: string;
}

export interface PlanBuilding {
  id: string;
  name: string;
  address: string;
  type: string;
  rooms?: PlanRoom[];
  constructionDate: string;
  squareFootage: number;
  numberOfRooms: number;
  dsaNumber: string;
  notes: string;
}

// Mock data for testing
const mockBuildings: PlanBuilding[] = [
  {
    id: '1',
    name: 'Main Office Building',
    address: '123 Main St',
    type: 'Office',
    rooms: [
      {
        id: '101',
        name: 'Conference Room A',
        number: '101',
        floor: '1',
        type: 'Conference'
      },
      {
        id: '102',
        name: 'Office Suite B',
        number: '102',
        floor: '1',
        type: 'Office'
      }
    ],
    constructionDate: '2024-01-01',
    squareFootage: 10000,
    numberOfRooms: 2,
    dsaNumber: 'DSA12345',
    notes: 'This is a main office building'
  },
  {
    id: '2',
    name: 'Research Center',
    address: '456 Science Ave',
    type: 'Laboratory',
    rooms: [
      {
        id: '201',
        name: 'Lab 1',
        number: '201',
        floor: '2',
        type: 'Laboratory'
      },
      {
        id: '202',
        name: 'Storage Room',
        number: '202',
        floor: '2',
        type: 'Storage'
      }
    ],
    constructionDate: '2023-05-15',
    squareFootage: 5000,
    numberOfRooms: 2,
    dsaNumber: 'DSA54321',
    notes: 'This is a research center'
  },
  {
    id: '3',
    name: 'Training Facility',
    address: '789 Education Blvd',
    type: 'Educational',
    rooms: [
      {
        id: '301',
        name: 'Training Room A',
        number: '301',
        floor: '3',
        type: 'Classroom'
      },
      {
        id: '302',
        name: 'Computer Lab',
        number: '302',
        floor: '3',
        type: 'Laboratory'
      }
    ],
    constructionDate: '2022-09-01',
    squareFootage: 8000,
    numberOfRooms: 2,
    dsaNumber: 'DSA98765',
    notes: 'This is a training facility'
  }
];

// In-memory storage
const inMemoryBuildings = [...mockBuildings];

export async function getPlanBuildings(): Promise<PlanBuilding[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...inMemoryBuildings];
}

export async function getPlanBuilding(id: string): Promise<PlanBuilding | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  const building = inMemoryBuildings.find(b => b.id === id);
  return building ? { ...building } : null;
}

export async function getPlanBuildingRooms(buildingId: string): Promise<PlanRoom[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  const building = await getPlanBuilding(buildingId);
  return building?.rooms || [];
}

export async function createBuilding(formData: FormData): Promise<PlanBuilding> {
  try {
    // Validate required fields
    const name = formData.get('name') as string;
    const buildingNumber = formData.get('buildingNumber') as string;
    const buildingType = formData.get('buildingType') as string;
    const constructionDate = formData.get('constructionDate') as string;
    const squareFootage = formData.get('squareFootage') as string;
    const numberOfRooms = formData.get('numberOfRooms') as string;
    const dsaNumber = formData.get('dsaNumber') as string;
    const notes = formData.get('notes') as string;

    if (!name || !buildingNumber || !buildingType || !constructionDate || !squareFootage) {
      throw new Error('Missing required fields');
    }

    // Create new building
    const newBuilding: PlanBuilding = {
      id: Date.now().toString(), // Generate a temporary ID
      name,
      address: buildingNumber, // Using building number as address for now
      type: buildingType,
      rooms: [], // Initialize with empty rooms array
      constructionDate,
      squareFootage: parseFloat(squareFootage),
      numberOfRooms: numberOfRooms ? parseInt(numberOfRooms) : 0,
      dsaNumber,
      notes
    };

    // Add to in-memory storage
    inMemoryBuildings.push(newBuilding);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return newBuilding;
  } catch (error) {
    console.error('Error in createBuilding:', error);
    throw error;
  }
}  