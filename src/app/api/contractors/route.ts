import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    
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
