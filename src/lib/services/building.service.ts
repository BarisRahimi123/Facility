import { supabase } from '../supabase';
import type { Building, BuildingFormData, Room } from '@/types/building';

interface RenovationData {
  date?: string;
  scope_of_work: string;
  square_footage_affected: number;
  start_date: string;
  completion_date: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  funding_source: string;
  dsa_approval_status: 'approved' | 'pending' | 'not_required';
  inspector_name: string;
  inspector_contact: string;
  estimated_budget: number;
  final_cost?: number;
  contractor_name: string;
  contractor_phone: string;
  contractor_email: string;
  architect_firm_name?: string;
  architect_firm_contact?: string;
  project_manager_name: string;
  project_manager_department: string;
  project_manager_contact: string;
  maintenance_plan: string;
  notes?: string;
  lessons_learned?: string;
}

interface RenovationResponse extends RenovationData {
  id: string;
  building_id: string;
  created_at: string;
  updated_at: string;
  renovation_change_orders: Array<{
    id: string;
    renovation_id: string;
    description: string;
    cost_adjustment: number;
    date: string;
    created_at: string;
  }>;
  renovation_warranties: Array<{
    id: string;
    renovation_id: string;
    item: string;
    expiry_date: string;
    details: string;
    created_at: string;
  }>;
}

export class BuildingService {
  /**
   * Create a new building
   */
  static async createBuilding(buildingData: BuildingFormData): Promise<Building> {
    const { data, error } = await supabase
      .from('buildings')
      .insert(buildingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get a building by ID
   */
  static async getBuildingById(id: string): Promise<Building | null> {
    try {
      console.log(`Fetching building with ID: ${id}`);
      
      // First, get the basic building data without joins
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', id)
        .single();

      if (buildingError) {
        console.error('Error fetching building:', buildingError);
        throw buildingError;
      }

      if (!building) {
        return null;
      }

      // Try to fetch rooms separately if the table exists
      try {
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .eq('building_id', id)
          .order('room_number');

        if (!roomsError && rooms) {
          building.rooms = rooms;
        } else {
          console.log('Rooms table not available or empty');
          building.rooms = [];
        }
      } catch (roomError) {
        console.log('Could not fetch rooms:', roomError);
        building.rooms = [];
      }

      return building;
    } catch (error) {
      console.error('Error in getBuildingById:', error);
      throw error;
    }
  }

  /**
   * Get all buildings for a facility
   */
  static async getBuildingsByFacilityId(facilityId: string): Promise<Building[]> {
    try {
      console.log(`Fetching buildings for facility ${facilityId}`);
      
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('facility_id', facilityId)
        .order('name');

      if (error) {
        console.error('Supabase error fetching buildings:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Check if it's a foreign key error
        if (error.code === '23503') {
          console.error(`Facility with ID ${facilityId} does not exist in the database`);
        }
        
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} buildings`);
      return data || [];
    } catch (error) {
      console.error('Error in getBuildingsByFacilityId:', error);
      // Return empty array on error to prevent page crash
      return [];
    }
  }

  /**
   * Update a building
   */
  static async updateBuilding(id: string, buildingData: Partial<Building>): Promise<Building> {
    const { data, error } = await supabase
      .from('buildings')
      .update(buildingData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a building
   */
  static async deleteBuilding(id: string): Promise<void> {
    const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Add a room to a building
   */
  static async addRoom(roomData: Room): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add a renovation to a building
   */
  static async addRenovation(buildingId: string, renovationData: RenovationData): Promise<RenovationResponse> {
    const { data, error } = await supabase
      .from('building_renovations')
      .insert({
        ...renovationData,
        building_id: buildingId
      })
      .select(`
        *,
        renovation_change_orders (*),
        renovation_warranties (*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Search buildings by name or number
   */
  static async searchBuildings(facilityId: string, query: string): Promise<Building[]> {
    const { data, error } = await supabase
      .from('buildings')
      .select(`
        *,
        rooms (*),
        building_renovations (
          *,
          renovation_change_orders (*),
          renovation_warranties (*)
        )
      `)
      .eq('facility_id', facilityId)
      .or(`name.ilike.%${query}%,building_number.ilike.%${query}%`);

    if (error) throw error;
    return data || [];
  }
} 