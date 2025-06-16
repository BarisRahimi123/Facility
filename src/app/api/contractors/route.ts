import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Create a Supabase client for the current request
function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? '';
        },
        set(name: string, value: string) {
          cookieStore.set(name, value);
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    }
  );
}

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('contractors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contractors' },
      { status: 500 }
    );
  }
} 