import { NextRequest, NextResponse } from 'next/server';
import { getFacilityById } from '@/app/actions/facilities';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  try {
    const { facilityId } = await params;
    console.log('API: Fetching facility with ID:', facilityId);
    
    // Use the server action to get facility data
    const facility = await getFacilityById(facilityId);
    
    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(facility);
  } catch (error) {
    console.error('API: Error fetching facility:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility' },
      { status: 500 }
    );
  }
} 