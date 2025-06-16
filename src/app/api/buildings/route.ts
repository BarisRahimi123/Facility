import { NextRequest, NextResponse } from 'next/server';
import { getBuildings } from '@/app/actions/buildings';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const facilityId = searchParams.get('facilityId');
    
    // Get all buildings
    const allBuildings = await getBuildings();
    
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