import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Import the mockFacilities data to reuse it
// In a real application, we would fetch this from Supabase
import { mockFacilities } from '../../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId } = await params;

  try {
    // In a real application, you would fetch data from Supabase
    // const { data, error } = await supabase
    //   .from('facilities')
    //   .select('*')
    //   .eq('id', id)
    //   .single();
    // 
    // if (error) {
    //   console.error('Error fetching facility:', error);
    //   return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    // 
    // if (!data) {
    //   return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    // }
    // 
    // return NextResponse.json(data);

    // For now, just return mock data
    const facility = mockFacilities.find((facility: any) => facility.id === facilityId);

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    return NextResponse.json(facility);
  } catch (error) {
    console.error('Error in facility API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId } = await params;
  
  try {
    const body = await request.json();
    
    // In a real app, you would update in Supabase
    // const { data, error } = await supabase
    //   .from('facilities')
    //   .update(body)
    //   .eq('id', id)
    //   .select();
    //
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    
    // Mock response
    const facility = mockFacilities.find((facility: any) => facility.id === facilityId);
    
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }
    
    const updatedFacility = {
      ...facility,
      ...body,
      updated_at: new Date().toISOString(),
    };
    
    return NextResponse.json(updatedFacility);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ facilityId: string }> }
) {
  const { facilityId } = await params;
  
  try {
    // In a real app, you would delete from Supabase
    // const { error } = await supabase
    //   .from('facilities')
    //   .delete()
    //   .eq('id', id);
    //
    // if (error) {
    //   return NextResponse.json({ error: error.message }, { status: 500 });
    // }
    
    return NextResponse.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete facility' },
      { status: 500 }
    );
  }
} 