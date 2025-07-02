export type OrganizationType = 'renter' | 'district' | 'school';
export type OrganizationSubtype = 'individual' | 'commercial' | 'nonprofit';

export interface Organization {
  id: string;
  name: string;
  display_name?: string;
  type: OrganizationType;
  subtype?: OrganizationSubtype;
  is_active: boolean;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  city?: string;
  state?: string;
  requires_insurance?: boolean;
  minimum_liability_coverage?: number;
  created_at: string;
} 