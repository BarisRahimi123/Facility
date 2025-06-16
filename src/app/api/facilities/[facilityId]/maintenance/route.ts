import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: { params: { facilityId: string } }
) {
  try {
    // First get all buildings for this facility
    const { data: buildings, error: buildingsError } = await serviceRoleClient
      .from('buildings')
      .select('id')
      .eq('facility_id', params.facilityId);

    if (buildingsError) {
      console.error('Error fetching buildings:', buildingsError);
      return NextResponse.json({ error: 'Error fetching buildings' }, { status: 500 });
    }

    if (!buildings || buildings.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Get all building systems for these buildings
    const buildingIds = buildings.map(b => b.id);
    const { data: systems, error: systemsError } = await serviceRoleClient
      .from('building_systems')
      .select('id, name')
      .in('building_id', buildingIds);

    if (systemsError) {
      console.error('Error fetching systems:', systemsError);
      return NextResponse.json({ error: 'Error fetching systems' }, { status: 500 });
    }

    if (!systems || systems.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Get all maintenance schedules for these systems
    const systemIds = systems.map(s => s.id);
    const { data: schedules, error: schedulesError } = await serviceRoleClient
      .from('maintenance_schedules')
      .select(`
        id,
        title,
        description,
        maintenance_type,
        frequency,
        installation_date,
        next_maintenance_date,
        last_completed_date,
        status,
        building_system_id
      `)
      .in('building_system_id', systemIds);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json({ error: 'Error fetching schedules' }, { status: 500 });
    }

    // Add system names to schedules
    const schedulesWithSystemNames = schedules?.map(schedule => {
      const system = systems.find(s => s.id === schedule.building_system_id);
      return {
        ...schedule,
        system_name: system?.name || 'Unknown System'
      };
    }) || [];

    return NextResponse.json(schedulesWithSystemNames);
  } catch (error) {
    console.error('Error in maintenance route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 