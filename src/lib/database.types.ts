export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Users table
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: 'admin' | 'staff' | 'observer' | 'vendor'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'staff' | 'observer' | 'vendor'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'staff' | 'observer' | 'vendor'
          created_at?: string
          updated_at?: string
        }
      }
      
      // Plans Folders table
      plans_folders: {
        Row: {
          id: string
          name: string
          discipline: string
          phase: string
          item_count: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          discipline: string
          phase: string
          item_count?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          discipline?: string
          phase?: string
          item_count?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }

      // Plans table
      plans: {
        Row: {
          id: string
          folder_id: string
          name: string
          title: string
          description: string | null
          sheet_number: string
          revision: string
          scale: string
          type: string
          size: number | null
          url: string | null
          thumbnail_url: string | null
          building_refs: Array<{
            buildingId: string
            roomIds?: string[]
          }> | null
          status: string
          version: string
          uploaded_by: string
          uploaded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          name: string
          title: string
          description?: string | null
          sheet_number: string
          revision: string
          scale: string
          type: string
          size?: number | null
          url?: string | null
          thumbnail_url?: string | null
          building_refs?: Array<{
            buildingId: string
            roomIds?: string[]
          }> | null
          status?: string
          version?: string
          uploaded_by: string
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          name?: string
          title?: string
          description?: string | null
          sheet_number?: string
          revision?: string
          scale?: string
          type?: string
          size?: number | null
          url?: string | null
          thumbnail_url?: string | null
          building_refs?: Array<{
            buildingId: string
            roomIds?: string[]
          }> | null
          status?: string
          version?: string
          uploaded_by?: string
          uploaded_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Facilities table
      facilities: {
        Row: {
          id: string
          name: string
          facility_type: string
          address: string
          description: string | null
          square_footage: number
          number_of_floors: number | null
          year_built: string | null
          last_renovation_date: string | null
          facility_condition_index: number
          status: 'active' | 'inactive' | 'maintenance'
          rooms: number | null
          active_issues: number | null
          occupancy_rate: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          facility_type: string
          address: string
          description?: string | null
          square_footage: number
          number_of_floors?: number | null
          year_built?: string | null
          last_renovation_date?: string | null
          facility_condition_index: number
          status?: 'active' | 'inactive' | 'maintenance'
          rooms?: number | null
          active_issues?: number | null
          occupancy_rate?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          facility_type?: string
          address?: string
          description?: string | null
          square_footage?: number
          number_of_floors?: number | null
          year_built?: string | null
          last_renovation_date?: string | null
          facility_condition_index?: number
          status?: 'active' | 'inactive' | 'maintenance'
          rooms?: number | null
          active_issues?: number | null
          occupancy_rate?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Buildings table
      buildings: {
        Row: {
          id: string
          facility_id: string
          name: string
          building_number: string | null
          construction_date: string
          building_type: string
          square_footage: number
          number_of_rooms: number
          status: 'active' | 'inactive' | 'maintenance'
          dsa_number: string | null
          linked_plan_folders: string[] | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          facility_id: string
          name: string
          building_number?: string | null
          construction_date: string
          building_type: string
          square_footage: number
          number_of_rooms: number
          status?: 'active' | 'inactive' | 'maintenance'
          dsa_number?: string | null
          linked_plan_folders?: string[] | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          facility_id?: string
          name?: string
          building_number?: string | null
          construction_date?: string
          building_type?: string
          square_footage?: number
          number_of_rooms?: number
          status?: 'active' | 'inactive' | 'maintenance'
          dsa_number?: string | null
          linked_plan_folders?: string[] | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      // Rooms table
      rooms: {
        Row: {
          id: string
          building_id: string
          room_number: string
          room_function: string
          square_footage: number
          capacity: number | null
          floor: string
          furniture_details: Json | null
          accessibility_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          room_number: string
          room_function: string
          square_footage: number
          capacity?: number | null
          floor: string
          furniture_details?: Json | null
          accessibility_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          room_number?: string
          room_function?: string
          square_footage?: number
          capacity?: number | null
          floor?: string
          furniture_details?: Json | null
          accessibility_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Building Systems table
      building_systems: {
        Row: {
          id: string
          building_id: string
          name: string
          system_type: string
          manufacturer: string | null
          model: string | null
          serial_number: string | null
          installation_date: string | null
          warranty_expiration: string | null
          condition: string
          status: string
          last_maintenance_date: string | null
          maintenance_frequency: string | null
          next_maintenance_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          name: string
          system_type: string
          manufacturer?: string | null
          model?: string | null
          serial_number?: string | null
          installation_date?: string | null
          warranty_expiration?: string | null
          condition: string
          status: string
          last_maintenance_date?: string | null
          maintenance_frequency?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          name?: string
          system_type?: string
          manufacturer?: string | null
          model?: string | null
          serial_number?: string | null
          installation_date?: string | null
          warranty_expiration?: string | null
          condition?: string
          status?: string
          last_maintenance_date?: string | null
          maintenance_frequency?: string | null
          next_maintenance_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Renovations table
      building_renovations: {
        Row: {
          id: string
          building_id: string
          date: string | null
          scope_of_work: string
          square_footage_affected: number
          start_date: string
          completion_date: string
          status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
          budget: number
          actual_cost: number
          contractor_name: string
          contractor_contact: string
          permit_numbers: string | null
          permit_issue_date: string | null
          inspection_dates: string | null
          inspection_results: string | null
          funding_source: string
          dsa_approval_status: 'approved' | 'pending' | 'not_required'
          inspector_of_record: Json
          estimated_budget: number
          final_cost: number | null
          contractor_details: Json
          architect_firm: Json | null
          project_manager: Json
          maintenance_plan: string
          notes: string | null
          lessons_learned: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          building_id: string
          date?: string | null
          scope_of_work: string
          square_footage_affected: number
          start_date: string
          completion_date: string
          status?: 'planning' | 'in_progress' | 'completed' | 'on_hold'
          budget: number
          actual_cost: number
          contractor_name: string
          contractor_contact: string
          permit_numbers?: string | null
          permit_issue_date?: string | null
          inspection_dates?: string | null
          inspection_results?: string | null
          funding_source: string
          dsa_approval_status?: 'approved' | 'pending' | 'not_required'
          inspector_of_record: Json
          estimated_budget: number
          final_cost?: number | null
          contractor_details: Json
          architect_firm?: Json | null
          project_manager: Json
          maintenance_plan: string
          notes?: string | null
          lessons_learned?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          building_id?: string
          date?: string | null
          scope_of_work?: string
          square_footage_affected?: number
          start_date?: string
          completion_date?: string
          status?: 'planning' | 'in_progress' | 'completed' | 'on_hold'
          budget?: number
          actual_cost?: number
          contractor_name?: string
          contractor_contact?: string
          permit_numbers?: string | null
          permit_issue_date?: string | null
          inspection_dates?: string | null
          inspection_results?: string | null
          funding_source?: string
          dsa_approval_status?: 'approved' | 'pending' | 'not_required'
          inspector_of_record?: Json
          estimated_budget?: number
          final_cost?: number | null
          contractor_details?: Json
          architect_firm?: Json | null
          project_manager?: Json
          maintenance_plan?: string
          notes?: string | null
          lessons_learned?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      
      // Maintenance Tasks table
      maintenance_tasks: {
        Row: {
          id: string
          title: string
          description: string
          type: 'corrective' | 'preventive'
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
          workflow_status: 'new' | 'pending_estimate' | 'estimates_received' | 'estimate_accepted' | 'po_issued' | 'in_progress' | 'completed'
          start_date: string
          end_date: string | null
          estimated_duration: number
          facility_id: string
          building_id: string | null
          room_id: string | null
          location: string
          system_type: string | null
          issue_type: string | null
          impact: 'low' | 'medium' | 'high' | null
          severity: 'low' | 'medium' | 'high' | null
          assignment_type: 'internal' | 'contractor' | null
          assigned_to: string | null
          completed_at: string | null
          cancelled_at: string | null
          notes: string | null
          submitter_name: string | null
          submitter_email: string | null
          submitter_phone: string | null
          attachments: string[] | null
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: 'corrective' | 'preventive'
          priority: 'low' | 'medium' | 'high' | 'critical'
          status?: 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
          workflow_status?: 'new' | 'pending_estimate' | 'estimates_received' | 'estimate_accepted' | 'po_issued' | 'in_progress' | 'completed'
          start_date: string
          end_date?: string | null
          estimated_duration: number
          facility_id: string
          building_id?: string | null
          room_id?: string | null
          location: string
          system_type?: string | null
          issue_type?: string | null
          impact?: 'low' | 'medium' | 'high' | null
          severity?: 'low' | 'medium' | 'high' | null
          assignment_type?: 'internal' | 'contractor' | null
          assigned_to?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          notes?: string | null
          submitter_name?: string | null
          submitter_email?: string | null
          submitter_phone?: string | null
          attachments?: string[] | null
          created_by: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: 'corrective' | 'preventive'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
          workflow_status?: 'new' | 'pending_estimate' | 'estimates_received' | 'estimate_accepted' | 'po_issued' | 'in_progress' | 'completed'
          start_date?: string
          end_date?: string | null
          estimated_duration?: number
          facility_id?: string
          building_id?: string | null
          room_id?: string | null
          location?: string
          system_type?: string | null
          issue_type?: string | null
          impact?: 'low' | 'medium' | 'high' | null
          severity?: 'low' | 'medium' | 'high' | null
          assignment_type?: 'internal' | 'contractor' | null
          assigned_to?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          notes?: string | null
          submitter_name?: string | null
          submitter_email?: string | null
          submitter_phone?: string | null
          attachments?: string[] | null
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Export a default value to make the file a module
export default Database; 