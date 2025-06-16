import type { FacilitySystemFormData } from './facility';

export interface FormShare {
  id: string;
  form_id: string;
  token: string;
  recipient: string;
  expires_at: string;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
  response_data?: FacilitySystemFormData;
} 