'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';

export interface FacilityStats {
  totalRooms: number;
  totalBuildings: number;
  totalSquareFootage: number;
  activeIssues: number;
  occupancyRate: number;
}

export async function getFacilityStats(facilityId: string): Promise<FacilityStats> {
  const serviceClient = getServiceRoleClient();
  
  try {
    // Get all buildings for this facility
    const { data: buildings, error: buildingsError } = await serviceClient
      .from('buildings')
      .select('id, square_footage')
      .eq('facility_id', facilityId);

    if (buildingsError) {
      console.error('Error fetching buildings:', buildingsError);
      return {
        totalRooms: 0,
        totalBuildings: 0,
        totalSquareFootage: 0,
        activeIssues: 0,
        occupancyRate: 0
      };
    }

    const totalBuildings = buildings?.length || 0;
    const totalSquareFootage = buildings?.reduce((sum, b) => sum + (b.square_footage || 0), 0) || 0;

    // Get room count for each building
    let totalRooms = 0;
    if (buildings && buildings.length > 0) {
      const buildingIds = buildings.map(b => b.id);
      const { data: rooms, error: roomsError } = await serviceClient
        .from('rooms')
        .select('id')
        .in('building_id', buildingIds);

      if (!roomsError && rooms) {
        totalRooms = rooms.length;
      }
    }

    // Get active maintenance tasks (as a proxy for active issues)
    const { data: tasks, error: tasksError } = await serviceClient
      .from('maintenance_tasks')
      .select('id')
      .eq('facility_id', facilityId)
      .in('status', ['pending', 'in_progress']);

    const activeIssues = tasks?.length || 0;

    // Calculate occupancy rate (you might want to implement this based on your business logic)
    // For now, we'll return a placeholder
    const occupancyRate = 0;

    return {
      totalRooms,
      totalBuildings,
      totalSquareFootage,
      activeIssues,
      occupancyRate
    };
  } catch (error) {
    console.error('Error calculating facility stats:', error);
    return {
      totalRooms: 0,
      totalBuildings: 0,
      totalSquareFootage: 0,
      activeIssues: 0,
      occupancyRate: 0
    };
  }
}





