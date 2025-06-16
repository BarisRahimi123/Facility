import { Building, BuildingFormData } from '@/types/building';
import { createClient } from '@/lib/supabase/client';

export class BuildingService {
  private static supabase = createClient();

  static async getBuildingsByFacilityId(facilityId: string): Promise<Building[]> {
    try {
      const { data, error } = await this.supabase
        .from('buildings')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching buildings:', error);
        throw error;
      }

      return data as Building[];
    } catch (error) {
      console.error('Error in getBuildingsByFacilityId:', error);
      throw error;
    }
  }

  static async getBuildingById(buildingId: string): Promise<Building | null> {
    try {
      const { data, error } = await this.supabase
        .from('buildings')
        .select('*')
        .eq('id', buildingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching building:', error);
        throw error;
      }

      return data as Building;
    } catch (error) {
      console.error('Error in getBuildingById:', error);
      throw error;
    }
  }

  static async createBuilding(buildingData: BuildingFormData): Promise<Building> {
    try {
      const { data, error } = await this.supabase
        .from('buildings')
        .insert([buildingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating building:', error);
        throw error;
      }

      return data as Building;
    } catch (error) {
      console.error('Error in createBuilding:', error);
      throw error;
    }
  }

  static async updateBuilding(
    buildingId: string,
    buildingData: Partial<BuildingFormData>
  ): Promise<Building> {
    try {
      const { data, error } = await this.supabase
        .from('buildings')
        .update(buildingData)
        .eq('id', buildingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating building:', error);
        throw error;
      }

      return data as Building;
    } catch (error) {
      console.error('Error in updateBuilding:', error);
      throw error;
    }
  }

  static async deleteBuilding(buildingId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId);

      if (error) {
        console.error('Error deleting building:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteBuilding:', error);
      throw error;
    }
  }
} 