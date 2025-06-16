import { NextRequest, NextResponse } from 'next/server';
import { withSupabase } from '@/lib/supabase/admin-client';
import { mockBuildings } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');
    
    // Get all buildings using the withSupabase helper
    const allBuildings = await withSupabase(
      async (client) => {
        const { data, error } = await client
          .from('buildings')
          .select('*');
          
        if (error) throw error;
        return data;
      },
      mockBuildings // Fallback mock data
    );
    
    // Filter by facility ID if provided
    if (facilityId) {
      const filteredBuildings = allBuildings.filter(
        building => building.facility_id === facilityId
      );
      return NextResponse.json(filteredBuildings);
    }
    
    return NextResponse.json(allBuildings);
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
} 