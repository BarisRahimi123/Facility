'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { MaintenanceTask, RequestForQuote, VendorEstimate } from '@/types/maintenance';

export async function getTasks(facilityId?: string) {
  const supabase = await createServerSupabaseClient();
  
  let query = supabase
    .from('tasks')
    .select(`
      *,
      request_for_quotes (
        *,
        vendor_estimates (
          *,
          estimate_line_items (*)
        )
      )
    `);

  if (facilityId) {
    query = query.eq('facility_id', facilityId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTask(taskId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      request_for_quotes (
        *,
        vendor_estimates (
          *,
          estimate_line_items (*)
        )
      )
    `)
    .eq('id', taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTask(task: Partial<MaintenanceTask>) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      created_by: session.user.id,
      updated_by: session.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/tasks');
  return data;
}

export async function updateTask(taskId: string, updates: Partial<MaintenanceTask>) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_by: session.user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/tasks');
  return data;
}

export async function deleteTask(taskId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  revalidatePath('/tasks');
}

export async function createRFQ(taskId: string, rfq: Partial<RequestForQuote>) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('request_for_quotes')
    .insert({
      ...rfq,
      task_id: taskId,
      created_by: session.user.id
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/tasks');
  return data;
}

export async function submitEstimate(rfqId: string, estimate: Partial<VendorEstimate>) {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('vendor_estimates')
    .insert({
      ...estimate,
      rfq_id: rfqId,
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath('/tasks');
  return data;
} 