import BuildingDetailClient from './BuildingDetailClient';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const serviceRoleClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface PageProps {
  params: {
    facilityId: string;
    buildingId: string;
  };
}

async function getBuilding(buildingId: string) {
  try {
    console.log('Fetching building:', buildingId);
    
    const { data: building, error } = await serviceRoleClient
      .from('buildings')
      .select('*')
      .eq('id', buildingId)
      .single();

    if (error) {
      console.error('Error fetching building:', error);
      return null;
    }

    // Fetch rooms for this building
    const { data: rooms } = await serviceRoleClient
      .from('rooms')
      .select('*')
      .eq('building_id', buildingId)
      .order('room_number');

    // Try to fetch building systems
    let systems = [];
    try {
      const { data: buildingSystems, error: systemsError } = await serviceRoleClient
        .from('building_systems')
        .select('*')
        .eq('building_id', buildingId)
        .order('created_at', { ascending: false });
      
      if (systemsError) {
        console.error('Error fetching building systems:', systemsError);
      } else {
      systems = buildingSystems || [];
        console.log('Fetched building systems:', buildingSystems?.length, 'systems');
        // Debug: Log the first system to see its structure
        if (buildingSystems?.length > 0) {
          console.log('Sample system data:', JSON.stringify(buildingSystems[0], null, 2));
        }
      }
    } catch (error) {
      console.log('Building systems table not available:', error);
    }

    // Try to fetch renovations
    let renovations = [];
    try {
      const { data: buildingRenovations } = await serviceRoleClient
        .from('renovations')
        .select('*')
        .eq('building_id', buildingId)
        .order('start_date', { ascending: false });
      renovations = buildingRenovations || [];
    } catch (error) {
      console.log('Renovations table not available');
    }

    return {
      ...building,
      rooms: rooms || [],
      building_systems: systems,
      renovations: renovations
    };
  } catch (error) {
    console.error('Error in getBuilding:', error);
    return null;
  }
}

async function getFacility(facilityId: string) {
  try {
    const { data: facility, error } = await serviceRoleClient
      .from('facilities')
      .select('name')
      .eq('id', facilityId)
      .single();

    if (error) {
      console.error('Error fetching facility:', error);
      return null;
    }

    return facility;
  } catch (error) {
    console.error('Error in getFacility:', error);
    return null;
  }
}

export default async function BuildingDetailPage({ params }: PageProps) {
  const { facilityId, buildingId } = params;

  const [building, facility] = await Promise.all([
    getBuilding(buildingId),
    getFacility(facilityId)
  ]);

  if (!building) {
    notFound();
  }

  return (
    <BuildingDetailClient 
      building={building} 
      facility={facility}
      facilityId={facilityId}
      buildingId={buildingId}
    />
  );
} 