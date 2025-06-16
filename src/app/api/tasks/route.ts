import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { MaintenanceTask } from '@/types/maintenance';

// Create a Supabase client for the current request
function createClient() {
  const requestHeaders = new Headers(headers());
  const response = new Response();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = requestHeaders.get(`cookie-${name}`);
          return cookie ?? '';
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.set(
            'Set-Cookie',
            `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`
          );
        },
        remove(name: string, options: CookieOptions) {
          response.headers.set(
            'Set-Cookie',
            `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
          );
        },
      },
    }
  );
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const facilityId = searchParams.get('facilityId');

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
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const task: Partial<MaintenanceTask> = await request.json();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      created_by: session.user.id,
      updated_by: session.user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const { taskId, updates }: { taskId: string; updates: Partial<MaintenanceTask> } = await request.json();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
} 