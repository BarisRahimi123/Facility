import { supabase } from '../supabase';
import type { Facility, FacilityFormData } from '@/types/facility';

export class FacilityService {
  /**
   * Create a new facility
   */
  static async createFacility(facilityData: FacilityFormData): Promise<Facility> {
    try {
      // Map the form data fields to database fields
      const dbData: Record<string, any> = {
        name: facilityData.name,
        facility_type: facilityData.facility_type,
        status: facilityData.status || 'active',
        created_by: facilityData.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add optional fields if they exist
      if (facilityData.address) dbData.address = facilityData.address;
      if (facilityData.total_square_footage !== undefined) dbData.square_footage = facilityData.total_square_footage;
      if (facilityData.facility_condition_index !== undefined) dbData.facility_condition_index = facilityData.facility_condition_index;
      if ((facilityData as any).description) dbData.description = (facilityData as any).description;
      if ((facilityData as any).rooms !== undefined) dbData.rooms = (facilityData as any).rooms;
      if ((facilityData as any).active_issues !== undefined) dbData.active_issues = (facilityData as any).active_issues;
      if ((facilityData as any).occupancy_rate !== undefined) dbData.occupancy_rate = (facilityData as any).occupancy_rate;
      if ((facilityData as any).year_built !== undefined) dbData.year_built = (facilityData as any).year_built;

      console.log('Creating facility with data:', dbData);

      const { data, error } = await supabase
        .from('facilities')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Error creating facility:', error);
        throw error;
      }
      
      console.log('Facility created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in FacilityService.createFacility:', error);
      throw error;
    }
  }

  /**
   * Get a facility by ID
   */
  static async getFacilityById(id: string): Promise<Facility | null> {
    try {
      console.log(`Fetching facility with ID: ${id}`);
      
      // First, try a simple query without joins for faster response
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching facility:', error);
        
        // Only retry once if it's a connection error
        if (error.message && error.message.includes('fetch')) {
          console.log('Connection error detected, retrying once...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait only 1 second
          
          const { data: retryData, error: retryError } = await supabase
            .from('facilities')
            .select('*')
            .eq('id', id)
            .single();
            
          if (retryError) {
            throw retryError;
          }
          
          return retryData;
        }
        
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in FacilityService.getFacilityById:', error);
      throw error;
    }
  }

  /**
   * Get all facilities
   */
  static async getAllFacilities(): Promise<Facility[]> {
    try {
      console.log('Fetching all facilities...');
      
      // Simple query without joins for faster response
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching facilities:', error);
        
        // Only retry once if it's a connection error
        if (error.message && error.message.includes('fetch')) {
          console.log('Connection error detected, retrying once...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait only 1 second
          
          const { data: retryData, error: retryError } = await supabase
            .from('facilities')
            .select('*')
            .order('name');
            
          if (retryError) {
            throw retryError;
          }
          
          return retryData || [];
        }
        
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in FacilityService.getAllFacilities:', error);
      throw error;
    }
  }

  /**
   * Update a facility
   */
  static async updateFacility(id: string, facilityData: Partial<FacilityFormData>): Promise<Facility> {
    try {
      // Map the form data fields to database fields
      const dbData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // Only include fields that exist in the database and are provided
      if (facilityData.name) dbData.name = facilityData.name;
      if (facilityData.facility_type) dbData.facility_type = facilityData.facility_type;
      if (facilityData.address) dbData.address = facilityData.address;
      if (facilityData.total_square_footage !== undefined) dbData.square_footage = facilityData.total_square_footage;
      if (facilityData.year_built !== undefined) dbData.year_built = facilityData.year_built;
      if (facilityData.facility_condition_index !== undefined) dbData.facility_condition_index = facilityData.facility_condition_index;
      if (facilityData.status) dbData.status = facilityData.status;
      
      console.log('Updating facility with data:', dbData);
      
      const { data, error } = await supabase
        .from('facilities')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating facility:', error);
        throw error;
      }
      
      console.log('Facility updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in FacilityService.updateFacility:', error);
      throw error;
    }
  }

  /**
   * Delete a facility
   */
  static async deleteFacility(id: string): Promise<void> {
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Search facilities by name or address
   */
  static async searchFacilities(query: string): Promise<Facility[]> {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        buildings (
          *,
          rooms (*),
          building_renovations (
            *,
            renovation_change_orders (*),
            renovation_warranties (*)
          )
        )
      `)
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .order('name');

    if (error) throw error;
    return data || [];
  }
} 