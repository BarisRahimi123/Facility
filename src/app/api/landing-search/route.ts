import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/admin-client';
import { Field } from '@/types/field';
import { Facility } from '@/types/facility';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  // Search and Filters
  const searchQuery = searchParams.get('search') || '';
  const itemType = searchParams.get('type') || 'all';
  const priceMin = parseInt(searchParams.get('priceMin') || '0', 10);
  const priceMax = parseInt(searchParams.get('priceMax') || '1000', 10);
  const capacityMin = parseInt(searchParams.get('capacityMin') || '0', 10);
  const capacityMax = parseInt(searchParams.get('capacityMax') || '500', 10);
  
  // Bounding Box for map view
  const swLat = searchParams.get('swLat');
  const swLng = searchParams.get('swLng');
  const neLat = searchParams.get('neLat');
  const neLng = searchParams.get('neLng');

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase client failed to initialize' }, { status: 500 });
  }

  try {
    let fieldsQuery = supabase.from('fields').select('*', { count: 'exact' });
    let facilitiesQuery = supabase.from('facilities').select('*', { count: 'exact' });

    // Apply search query
    if (searchQuery) {
      fieldsQuery = fieldsQuery.textSearch('name', searchQuery, { type: 'websearch' });
      facilitiesQuery = facilitiesQuery.textSearch('name', searchQuery, { type: 'websearch' });
    }

    // Apply bounding box filter
    if (swLat && swLng && neLat && neLng) {
      fieldsQuery = fieldsQuery
        .gte('latitude', parseFloat(swLat))
        .lte('latitude', parseFloat(neLat))
        .gte('longitude', parseFloat(swLng))
        .lte('longitude', parseFloat(neLng));
      
      // Assuming facilities also have lat/lng
      facilitiesQuery = facilitiesQuery
        .gte('latitude', parseFloat(swLat))
        .lte('latitude', parseFloat(neLat))
        .gte('longitude', parseFloat(swLng))
        .lte('longitude', parseFloat(neLng));
    }
    
    // Apply filters
    if (itemType !== 'all') {
      if (itemType === 'facility') {
        fieldsQuery = fieldsQuery.limit(0); // Return no fields
      } else if (itemType === 'field') {
        facilitiesQuery = facilitiesQuery.limit(0); // Return no facilities
      } else {
        fieldsQuery = fieldsQuery.eq('type', itemType);
        facilitiesQuery = facilitiesQuery.eq('facility_type', itemType);
      }
    }

    fieldsQuery = fieldsQuery.gte('hourly_rate', priceMin).lte('hourly_rate', priceMax);
    fieldsQuery = fieldsQuery.gte('capacity', capacityMin).lte('capacity', capacityMax);

    // Apply pagination
    fieldsQuery = fieldsQuery.range(offset, offset + limit - 1);
    facilitiesQuery = facilitiesQuery.range(offset, offset + limit - 1);

    // Execute queries in parallel
    const [
      { data: fields, count: fieldsCount, error: fieldsError },
      { data: facilities, count: facilitiesCount, error: facilitiesError }
    ] = await Promise.all([fieldsQuery, facilitiesQuery]);

    if (fieldsError || facilitiesError) {
      console.error('Error fetching data:', { fieldsError, facilitiesError });
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
    
    const totalCount = (fieldsCount || 0) + (facilitiesCount || 0);

    return NextResponse.json({
      items: [...(facilities || []), ...(fields || [])],
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });

  } catch (error) {
    console.error('Unexpected error in landing-search:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 