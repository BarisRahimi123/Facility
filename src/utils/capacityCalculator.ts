/**
 * Capacity Calculator - California Building Code (CBC) Compliance
 * 
 * This utility calculates room occupancy based on California Building Code
 * standards using standardized occupancy factors (sq ft per person).
 */

// CBC Occupancy factors (square feet per person)
const CBC_OCCUPANCY_FACTORS = {
  // Educational
  'Classroom': 20,        // 20 sq ft per student
  'Laboratory': 50,       // 50 sq ft per student  
  'Library': 50,          // 50 sq ft per student
  'Auditorium': 15,       // 15 sq ft per person
  'Gymnasium': 50,        // 50 sq ft per person
  
  // Office/Administrative
  'Office': 100,          // 100 sq ft per staff member
  'Conference': 15,       // 15 sq ft per staff member
  'Reception': 30,        // 30 sq ft per person
  'Break Room': 15,       // 15 sq ft per person
  
  // Healthcare/Medical
  'Medical Office': 120,  // 120 sq ft per person
  'Treatment Room': 240,  // 240 sq ft per person
  'Patient Room': 200,    // 200 sq ft per person
  
  // Storage/Utility
  'Storage': 300,         // 300 sq ft per person
  'Mechanical': 300,      // 300 sq ft per person
  'Janitorial': 300,      // 300 sq ft per person
  'Electrical': 300,      // 300 sq ft per person
  
  // Other
  'Restroom': 40,         // 40 sq ft per person
  'Hallway': 3,           // 3 sq ft per person
  'Lobby': 15,            // 15 sq ft per person
  'Cafeteria': 15,        // 15 sq ft per person
  'Kitchen': 200,         // 200 sq ft per person
  'Other': 100,           // Default fallback
} as const;

// Available room functions
export const ROOM_FUNCTIONS = Object.keys(CBC_OCCUPANCY_FACTORS) as Array<keyof typeof CBC_OCCUPANCY_FACTORS>;

/**
 * Calculate occupancy capacity based on room function and square footage
 * following California Building Code standards
 */
export function calculateCapacityByCode(roomFunction: string, squareFootage: number): number {
  if (!roomFunction || squareFootage <= 0) {
    return 0;
  }

  // Get occupancy factor for the room type
  const occupancyFactor = CBC_OCCUPANCY_FACTORS[roomFunction as keyof typeof CBC_OCCUPANCY_FACTORS];
  
  if (!occupancyFactor) {
    // Use default 'Other' factor if room function not found
    return Math.floor(squareFootage / CBC_OCCUPANCY_FACTORS.Other);
  }

  // Calculate capacity: square footage / occupancy factor
  return Math.floor(squareFootage / occupancyFactor);
}

/**
 * Get description of the capacity calculation for a given room function
 */
export function getCapacityCalculationDescription(roomFunction: string): string {
  const occupancyFactor = CBC_OCCUPANCY_FACTORS[roomFunction as keyof typeof CBC_OCCUPANCY_FACTORS];
  
  if (!occupancyFactor) {
    return `Auto-calculated using default occupancy factor (${CBC_OCCUPANCY_FACTORS.Other} sq ft per person)`;
  }

  const description = getDetailedDescription(roomFunction);
  return `Auto-calculated using CBC standard (${occupancyFactor} sq ft per person)${description ? ` - ${description}` : ''}`;
}

/**
 * Get detailed description for specific room types
 */
function getDetailedDescription(roomFunction: string): string {
  switch (roomFunction) {
    case 'Classroom':
      return 'Educational occupancy for K-12 instruction';
    case 'Laboratory':
      return 'Educational laboratory with equipment';
    case 'Library':
      return 'Educational library reading areas';
    case 'Auditorium':
      return 'Assembly use with fixed seating';
    case 'Gymnasium':
      return 'Assembly use for physical education';
    case 'Office':
      return 'Business occupancy for desk work';
    case 'Conference':
      return 'Business occupancy for meetings';
    case 'Medical Office':
      return 'Healthcare outpatient treatment';
    case 'Treatment Room':
      return 'Healthcare examination/treatment';
    case 'Patient Room':
      return 'Healthcare institutional occupancy';
    default:
      return '';
  }
}

/**
 * Get list of available room functions
 */
export function getAvailableRoomFunctions(): string[] {
  return ROOM_FUNCTIONS;
}

/**
 * Get occupancy factor for a room function
 */
export function getOccupancyFactor(roomFunction: string): number {
  return CBC_OCCUPANCY_FACTORS[roomFunction as keyof typeof CBC_OCCUPANCY_FACTORS] || CBC_OCCUPANCY_FACTORS.Other;
}

/**
 * Validate if a room function is supported
 */
export function isValidRoomFunction(roomFunction: string): boolean {
  return roomFunction in CBC_OCCUPANCY_FACTORS;
}

/**
 * Get capacity breakdown for multiple rooms
 */
export function calculateTotalCapacity(rooms: Array<{ room_function: string; square_footage: number }>): {
  totalCapacity: number;
  capacityByType: Record<string, number>;
  roomCount: number;
} {
  let totalCapacity = 0;
  const capacityByType: Record<string, number> = {};
  
  rooms.forEach(room => {
    const capacity = calculateCapacityByCode(room.room_function, room.square_footage);
    totalCapacity += capacity;
    
    if (!capacityByType[room.room_function]) {
      capacityByType[room.room_function] = 0;
    }
    capacityByType[room.room_function] += capacity;
  });

  return {
    totalCapacity,
    capacityByType,
    roomCount: rooms.length
  };
}

/**
 * Calculate minimum room size requirements
 */
export function getMinimumRoomSize(roomFunction: string): number | null {
  // California specific minimum room sizes for educational facilities
  switch (roomFunction) {
    case 'Classroom':
      return 960; // Minimum 960 sq ft for grades 1-12
    case 'Kindergarten':
      return 1350; // Minimum 1,350 sq ft for kindergarten
    case 'Laboratory':
      return 1200; // Minimum 1,200 sq ft for science labs
    case 'Library':
      return 1500; // Minimum 1,500 sq ft for library/media center
    default:
      return null; // No specific minimum requirement
  }
}

/**
 * Check if room meets minimum size requirements
 */
export function checkMinimumSizeCompliance(roomFunction: string, squareFootage: number): {
  isCompliant: boolean;
  minimumRequired: number | null;
  deficit: number;
} {
  const minimumRequired = getMinimumRoomSize(roomFunction);
  
  if (minimumRequired === null) {
    return {
      isCompliant: true,
      minimumRequired: null,
      deficit: 0
    };
  }

  const isCompliant = squareFootage >= minimumRequired;
  const deficit = isCompliant ? 0 : minimumRequired - squareFootage;

  return {
    isCompliant,
    minimumRequired,
    deficit
  };
} 