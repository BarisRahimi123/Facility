export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  construction_type?: string;
  square_footage?: number;
  number_of_buildings?: number;
  project_manager?: string;
  expected_completion?: string;
  last_visited?: string;
} 