import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AssignmentUser } from '@/types/staff';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['staff', 'manager', 'coordinator'])
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as AssignmentUser[] });
  } catch (error) {
    console.error('Error in GET /api/users/available:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 