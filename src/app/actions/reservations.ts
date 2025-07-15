'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { 
  Reservation, 
  CreateReservationData,
  ReservationSearchParams,
  ApprovalAction,
  ReservationStatus,
  PaymentStatus,
  InsuranceStatus
} from '@/types/reservation';

// Create service role client for direct database operations
function getServiceRoleSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// =====================================================
// RESERVATION CRUD OPERATIONS
// =====================================================

/**
 * Create a new reservation
 */
export async function createReservation(data: CreateReservationData) {
  try {
    const supabase = getServiceRoleSupabase();
    
    // Start a transaction
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        organization_id: data.organization_id,
        facility_id: data.facility_id,
        event_name: data.event_name,
        event_type: data.event_type,
        event_description: data.event_description,
        estimated_attendees: data.estimated_attendees,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        organization_name: data.organization_name,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        special_requests: data.special_requests,
        created_by_user_id: null, // Using service role, so no user context
      })
      .select()
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      return { error: 'Failed to create reservation' };
    }

    // Create reservation slots
    if (data.slots && data.slots.length > 0) {
      const slots = data.slots.map(slot => ({
        reservation_id: reservation.id,
        field_id: slot.field_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        quantity: slot.quantity || 1,
        rate_applied: 0, // Will be calculated based on field rates
        rate_type: 'hourly' as const,
        base_cost: 0, // Will be calculated
        total_cost: 0, // Will be calculated
        setup_start_time: slot.setup_start_time,
        breakdown_end_time: slot.breakdown_end_time,
      }));

      const { error: slotsError } = await supabase
        .from('reservation_slots')
        .insert(slots);

      if (slotsError) {
        console.error('Error creating reservation slots:', slotsError);
        // Rollback by deleting the reservation
        await supabase.from('reservations').delete().eq('id', reservation.id);
        return { error: 'Failed to create reservation slots' };
      }
    }

    // Add audit entry
    await supabase.from('reservation_history').insert({
      reservation_id: reservation.id,
      action: 'created',
      performed_by: null,
    });

    return { data: reservation };
  } catch (error) {
    console.error('Unexpected error creating reservation:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get reservation by ID with all relations
 */
export async function getReservation(id: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching reservation:', error);
      return { error: 'Failed to fetch reservation' };
    }

    // Fetch slots separately to avoid complex joins
    const { data: slots } = await supabase
      .from('reservation_slots')
      .select('*, field:fields(*)')
      .eq('reservation_id', id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    // Fetch payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('reservation_id', id)
      .order('created_at', { ascending: false });

    // Fetch insurance policies
    const { data: insurance_policies } = await supabase
      .from('insurance_policies')
      .select('*')
      .eq('reservation_id', id);

    // Fetch work orders
    const { data: work_orders } = await supabase
      .from('work_orders')
      .select('*')
      .eq('reservation_id', id);

    const reservation: Reservation = {
      ...data,
      slots: slots || [],
      payments: payments || [],
      insurance_policies: insurance_policies || [],
      work_orders: work_orders || [],
    };

    return { data: reservation };
  } catch (error) {
    console.error('Unexpected error fetching reservation:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Search reservations with filters
 */
export async function searchReservations(params: ReservationSearchParams) {
  try {
    const supabase = getServiceRoleSupabase();
    
    let query = supabase
      .from('reservations')
      .select(`
        *,
        organization:organizations(name, type, subtype)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.status && params.status.length > 0) {
      query = query.in('status', params.status);
    }

    if (params.facility_id) {
      query = query.eq('facility_id', params.facility_id);
    }

    if (params.organization_id) {
      query = query.eq('organization_id', params.organization_id);
    }

    if (params.payment_status && params.payment_status.length > 0) {
      query = query.in('payment_status', params.payment_status);
    }

    if (params.insurance_status && params.insurance_status.length > 0) {
      query = query.in('insurance_status', params.insurance_status);
    }

    if (params.search_term) {
      query = query.or(`
        reservation_number.ilike.%${params.search_term}%,
        event_name.ilike.%${params.search_term}%,
        contact_name.ilike.%${params.search_term}%,
        contact_email.ilike.%${params.search_term}%,
        organization_name.ilike.%${params.search_term}%
      `);
    }

    // Date filtering would need to join with reservation_slots
    // For now, we'll fetch all and filter in memory if dates are provided

    const { data, error } = await query;

    if (error) {
      console.error('Error searching reservations:', error);
      return { error: 'Failed to search reservations' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Unexpected error searching reservations:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Update reservation status
 */
export async function updateReservationStatus(
  id: string, 
  status: ReservationStatus | 'rejected',
  notes?: string
) {
  try {
    const supabase = getServiceRoleSupabase();
    
    // Get current reservation
    const { data: current, error: fetchError } = await supabase
      .from('reservations')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { error: 'Reservation not found' };
    }

    // Map 'rejected' to 'cancelled' with reason
    let actualStatus = status;
    if (status === 'rejected') {
      actualStatus = 'cancelled' as ReservationStatus;
    }

    // Update status
    const updateData: any = { 
      status: actualStatus,
      updated_at: new Date().toISOString()
    };

    if (status === 'rejected') {
      updateData.cancellation_reason = notes || 'Rejected by administrator';
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation status:', error);
      return { error: 'Failed to update reservation status' };
    }

    // Add audit entry
    await supabase.from('reservation_history').insert({
      reservation_id: id,
      action: status === 'rejected' ? 'rejected' : 'status_changed',
      field_changed: 'status',
      old_value: current.status,
      new_value: actualStatus,
      notes,
      performed_by: null,
    });

    return { data };
  } catch (error) {
    console.error('Unexpected error updating reservation status:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// =====================================================
// APPROVAL WORKFLOW
// =====================================================

/**
 * Pre-approve a reservation (site admin)
 */
export async function preApproveReservation(id: string, notes?: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'pre_approved' as ReservationStatus,
        pre_approved_at: new Date().toISOString(),
        pre_approved_by: null, // Would be current user ID in real app
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error pre-approving reservation:', error);
      return { error: 'Failed to pre-approve reservation' };
    }

    // Update approval history
    const history = data.approval_history || [];
    history.push({
      action: 'pre_approved',
      timestamp: new Date().toISOString(),
      user_id: null,
      notes,
    });

    await supabase
      .from('reservations')
      .update({ approval_history: history })
      .eq('id', id);

    // Add audit entry
    await supabase.from('reservation_history').insert({
      reservation_id: id,
      action: 'pre_approved',
      notes,
      performed_by: null,
    });

    return { data };
  } catch (error) {
    console.error('Unexpected error pre-approving reservation:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Final approve a reservation (district admin)
 */
export async function finalApproveReservation(id: string, notes?: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'approved' as ReservationStatus,
        final_approved_at: new Date().toISOString(),
        final_approved_by: null, // Would be current user ID in real app
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving reservation:', error);
      return { error: 'Failed to approve reservation' };
    }

    // Update approval history
    const history = data.approval_history || [];
    history.push({
      action: 'final_approved',
      timestamp: new Date().toISOString(),
      user_id: null,
      notes,
    });

    await supabase
      .from('reservations')
      .update({ approval_history: history })
      .eq('id', id);

    // Add audit entry
    await supabase.from('reservation_history').insert({
      reservation_id: id,
      action: 'final_approved',
      notes,
      performed_by: null,
    });

    // TODO: Create work orders automatically based on reservation

    return { data };
  } catch (error) {
    console.error('Unexpected error approving reservation:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Reject a reservation
 */
export async function rejectReservation(id: string, reason: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled' as ReservationStatus,
        cancelled_at: new Date().toISOString(),
        cancelled_by: null, // Would be current user ID in real app
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting reservation:', error);
      return { error: 'Failed to reject reservation' };
    }

    // Add audit entry
    await supabase.from('reservation_history').insert({
      reservation_id: id,
      action: 'rejected',
      reason,
      performed_by: null,
    });

    return { data };
  } catch (error) {
    console.error('Unexpected error rejecting reservation:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Request changes to a reservation
 */
export async function requestReservationChanges(
  id: string, 
  reason: string,
  requirements?: string[]
) {
  try {
    const supabase = getServiceRoleSupabase();
    
    // Update approval history with change request
    const { data: current, error: fetchError } = await supabase
      .from('reservations')
      .select('approval_history')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { error: 'Reservation not found' };
    }

    const history = current.approval_history || [];
    history.push({
      action: 'changes_requested',
      timestamp: new Date().toISOString(),
      user_id: null,
      reason,
      requirements,
    });

    const { data, error } = await supabase
      .from('reservations')
      .update({
        approval_history: history,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error requesting changes:', error);
      return { error: 'Failed to request changes' };
    }

    // Add audit entry
    await supabase.from('reservation_history').insert({
      reservation_id: id,
      action: 'changes_requested',
      reason,
      notes: requirements ? requirements.join(', ') : undefined,
      performed_by: null,
    });

    // TODO: Send notification to renter

    return { data };
  } catch (error) {
    console.error('Unexpected error requesting changes:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// =====================================================
// AVAILABILITY CHECKING
// =====================================================

/**
 * Check field availability for given dates/times
 */
export async function checkFieldAvailability(
  fieldId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
) {
  try {
    const supabase = getServiceRoleSupabase();
    
    // Check for conflicting reservations
    let query = supabase
      .from('reservation_slots')
      .select('*, reservation:reservations(*)')
      .eq('field_id', fieldId)
      .eq('date', date)
      .in('reservation.status', ['pre_approved', 'approved', 'paid', 'permitted']);

    if (excludeReservationId) {
      query = query.neq('reservation_id', excludeReservationId);
    }

    const { data: slots, error } = await query;

    if (error) {
      console.error('Error checking availability:', error);
      return { error: 'Failed to check availability' };
    }

    // Check for time conflicts
    const conflicts = slots?.filter((slot: any) => {
      const slotStart = slot.start_time;
      const slotEnd = slot.end_time;
      
      // Check if times overlap
      return (
        (startTime >= slotStart && startTime < slotEnd) ||
        (endTime > slotStart && endTime <= slotEnd) ||
        (startTime <= slotStart && endTime >= slotEnd)
      );
    });

    // Check blackout dates
    const { data: blackouts } = await supabase
      .from('blackout_dates')
      .select('*')
      .eq('field_id', fieldId)
      .eq('date', date);

    const isBlackedOut = blackouts && blackouts.length > 0;

    return { 
      data: {
        available: !isBlackedOut && (!conflicts || conflicts.length === 0),
        conflicts: conflicts || [],
        blackout: isBlackedOut,
      }
    };
  } catch (error) {
    console.error('Unexpected error checking availability:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// =====================================================
// FINANCIAL OPERATIONS
// =====================================================

/**
 * Calculate reservation pricing
 */
export async function calculateReservationPricing(reservationId: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    // This would be implemented based on:
    // - Field rates
    // - Organization type discounts
    // - Additional fees
    // - Tax calculations
    
    // For now, return a placeholder
    return {
      data: {
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        deposit_amount: 0,
      }
    };
  } catch (error) {
    console.error('Unexpected error calculating pricing:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get organizations
 */
export async function getOrganizations() {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching organizations:', error);
      return { error: 'Failed to fetch organizations' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching organizations:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get rate categories
 */
export async function getRateCategories() {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('rate_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching rate categories:', error);
      return { error: 'Failed to fetch rate categories' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching rate categories:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Get all reservations with related data
 */
export async function getReservations() {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        organization:organizations(id, name, type),
        field:fields(id, name, facility_id),
        slots:reservation_slots(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reservations:', error);
      return { error: 'Failed to fetch reservations', data: [] };
    }
    
    return { data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching reservations:', error);
    return { error: 'An unexpected error occurred', data: [] };
  }
}

/**
 * Update a reservation
 */
export async function updateReservation(id: string, data: Partial<Reservation>) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating reservation:', error);
      return { error: 'Failed to update reservation' };
    }
    
    return { data: reservation };
  } catch (error) {
    console.error('Unexpected error updating reservation:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Add a fee to a reservation
 */
export async function addReservationFee(reservationId: string, fee: {
  fee_type: string;
  description?: string;
  amount: number;
}) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('additional_fees')
      .insert([{
        reservation_id: reservationId,
        ...fee
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding fee:', error);
      return { error: 'Failed to add fee' };
    }
    
    return { data };
  } catch (error) {
    console.error('Unexpected error adding fee:', error);
    return { error: 'An unexpected error occurred' };
  }
}                