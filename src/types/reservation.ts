// =====================================================
// RESERVATION SYSTEM TYPES
// =====================================================

// Organization Types
export type OrganizationType = 'district' | 'school' | 'renter';
export type OrganizationSubtype = 'individual' | 'commercial' | 'nonprofit';

// User Roles
export type UserRole = 'renter' | 'staff' | 'site_approver' | 'district_approver' | 'maintenance' | 'support';

// Reservation Statuses
export type ReservationStatus = 'pending' | 'pre_approved' | 'approved' | 'paid' | 'permitted' | 'completed' | 'cancelled';
export type InsuranceStatus = 'pending' | 'submitted' | 'approved' | 'deficient' | 'waived';
export type PaymentStatus = 'pending' | 'deposit_paid' | 'full_paid' | 'invoiced' | 'refunded';

// Work Order Types
export type WorkOrderType = 'custodial' | 'hvac' | 'security' | 'setup' | 'breakdown' | 'cleaning';
export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

// Rate Types
export type RateType = 'hourly' | 'daily' | 'flat' | 'custom';
export type FeeType = 'rental' | 'custodial' | 'equipment' | 'security' | 'other';

// Organization Interface
export interface Organization {
  id: string;
  type: OrganizationType;
  subtype?: OrganizationSubtype;
  name: string;
  display_name?: string;
  tax_id?: string;
  
  // Contact information
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  billing_email?: string;
  
  // Address
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  
  // Insurance requirements
  insurance_requirements?: Record<string, any>;
  requires_insurance: boolean;
  minimum_liability_coverage?: number;
  
  // Settings
  auto_approve_internal: boolean;
  payment_terms?: string;
  notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
}

// Enhanced User Interface
export interface EnhancedUser {
  id: string;
  email: string;
  full_name?: string;
  organization_id?: string;
  role: UserRole;
  permissions?: Record<string, any>;
  phone?: string;
  is_active: boolean;
}

// Rate Category Interface
export interface RateCategory {
  id: string;
  organization_id?: string;
  name: string;
  description?: string;
  
  // Rate configuration
  rate_type: RateType;
  base_hourly_rate?: number;
  base_daily_rate?: number;
  
  // Rules and conditions
  rules?: Record<string, any>;
  minimum_hours: number;
  maximum_hours?: number;
  
  // Discounts
  nonprofit_discount_percent: number;
  school_discount_percent: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Enhanced Field Interface
export interface EnhancedField {
  id: string;
  facility_id: string;
  name: string;
  field_type: string;
  
  // Rental configuration
  rate_category_id?: string;
  organization_id?: string;
  minimum_rental_hours: number;
  maximum_rental_hours?: number;
  setup_time_hours: number;
  breakdown_time_hours: number;
  requires_custodial: boolean;
  requires_security: boolean;
  buffer_time_minutes: number;
  
  // Other field properties...
  hourly_rate: number;
  daily_rate: number;
  capacity: number;
  status: string;
}

// Main Reservation Interface
export interface Reservation {
  id: string;
  reservation_number: string;
  
  // Organization and user
  organization_id: string;
  created_by_user_id?: string;
  
  // Facility and space
  facility_id: string;
  
  // Status tracking
  status: ReservationStatus;
  insurance_status: InsuranceStatus;
  payment_status: PaymentStatus;
  
  // Event details
  event_name: string;
  event_type?: string;
  event_description?: string;
  estimated_attendees?: number;
  actual_attendees?: number;
  
  // Contact information
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  organization_name?: string;
  
  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Financial
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  deposit_percent: number;
  deposit_amount: number;
  amount_paid: number;
  
  // Additional services
  additional_services?: any[];
  special_requests?: string;
  internal_notes?: string;
  
  // Approval tracking
  approval_history?: any[];
  pre_approved_at?: string;
  pre_approved_by?: string;
  final_approved_at?: string;
  final_approved_by?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  
  // Relations
  organization?: Organization;
  facility?: any;
  slots?: ReservationSlot[];
  payments?: Payment[];
  insurance_policies?: InsurancePolicy[];
  work_orders?: WorkOrder[];
}

// Reservation Slot Interface
export interface ReservationSlot {
  id: string;
  reservation_id: string;
  field_id: string;
  
  // Date and time
  date: string;
  start_time: string;
  end_time: string;
  
  // Quantity and pricing
  quantity: number;
  rate_applied: number;
  rate_type: RateType;
  hours: number;
  
  // Cost calculation
  base_cost: number;
  additional_fees?: Record<string, any>;
  total_cost: number;
  
  // Setup/breakdown
  setup_start_time?: string;
  breakdown_end_time?: string;
  
  // Status
  is_confirmed: boolean;
  created_at: string;
  
  // Relations
  field?: EnhancedField;
}

// Insurance Policy Interface
export interface InsurancePolicy {
  id: string;
  reservation_id?: string;
  organization_id?: string;
  
  // Policy details
  policy_number?: string;
  insurance_company: string;
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  
  // Coverage
  general_liability_limit?: number;
  per_occurrence_limit?: number;
  property_damage_limit?: number;
  
  // Validity
  effective_date: string;
  expiration_date: string;
  
  // Documents
  certificate_url?: string;
  certificate_storage_path?: string;
  additional_insured_endorsement: boolean;
  
  // Verification
  verification_status: InsuranceStatus;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Payment Interface
export interface Payment {
  id: string;
  reservation_id: string;
  
  // Payment details
  payment_type: 'deposit' | 'full' | 'partial' | 'refund';
  payment_method: 'credit_card' | 'ach' | 'check' | 'cash' | 'paypal';
  amount: number;
  
  // Transaction details
  transaction_id?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  paypal_transaction_id?: string;
  check_number?: string;
  
  // Processing fees
  processing_fee: number;
  net_amount?: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  processed_at?: string;
  
  // Refund information
  is_refund: boolean;
  refund_reason?: string;
  original_payment_id?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
  notes?: string;
}

// Work Order Interface
export interface WorkOrder {
  id: string;
  work_order_number: string;
  reservation_id?: string;
  
  // Work order details
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Assignment
  assigned_to?: string;
  assigned_at?: string;
  assigned_by?: string;
  
  // Scheduling
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  estimated_hours?: number;
  actual_hours?: number;
  
  // Work details
  description?: string;
  instructions?: string;
  equipment_needed?: string[];
  supplies_needed?: string[];
  
  // Completion
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  
  // Cost tracking
  labor_cost: number;
  materials_cost: number;
  total_cost: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Additional Fee Interface
export interface AdditionalFee {
  id: string;
  organization_id?: string;
  
  // Fee details
  name: string;
  description?: string;
  fee_type: FeeType;
  
  // Amount configuration
  amount?: number;
  is_percentage: boolean;
  percentage_of?: 'subtotal' | 'rental_fee' | 'total';
  
  // Conditions
  is_optional: boolean;
  is_taxable: boolean;
  applies_to_internal: boolean;
  
  // Metadata
  created_at: string;
  is_active: boolean;
}

// Reservation Fee (Junction) Interface
export interface ReservationFee {
  id: string;
  reservation_id: string;
  fee_id: string;
  
  // Applied fee details
  quantity: number;
  unit_amount: number;
  total_amount: number;
  is_waived: boolean;
  waived_reason?: string;
  
  created_at: string;
  
  // Relations
  fee?: AdditionalFee;
}

// Reservation History/Audit Interface
export interface ReservationHistory {
  id: string;
  reservation_id: string;
  
  // Change details
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  
  // User and timestamp
  performed_by?: string;
  performed_at: string;
  
  // Additional context
  reason?: string;
  notes?: string;
}

// Search and Filter Types
export interface ReservationSearchParams {
  status?: ReservationStatus[];
  facility_id?: string;
  organization_id?: string;
  date_from?: string;
  date_to?: string;
  search_term?: string;
  payment_status?: PaymentStatus[];
  insurance_status?: InsuranceStatus[];
}

// Form Data Types for Creating Reservations
export interface CreateReservationData {
  organization_id?: string;
  facility_id: string;
  event_name: string;
  event_type?: string;
  event_description?: string;
  estimated_attendees?: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  organization_name?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  special_requests?: string;
  slots: CreateReservationSlotData[];
  additional_fees?: string[];
}

export interface CreateReservationSlotData {
  field_id: string;
  date: string;
  start_time: string;
  end_time: string;
  quantity?: number;
  setup_start_time?: string;
  breakdown_end_time?: string;
}

// Approval Action Types
export interface ApprovalAction {
  action: 'approve' | 'reject' | 'request_changes';
  reason?: string;
  notes?: string;
  additional_requirements?: string[];
} 