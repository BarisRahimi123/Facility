import { getFacilitiesForCurrentUser } from '@/app/actions/facilities';
import { getAllFieldsForMap } from '@/app/actions/fields';
import { LandingMapClient } from './LandingMapClient';
import type { Field } from '@/types/field';

interface Facility {
  id: string;
  name: string;
  address: string;
  facility_type: string;
  status: string;
  square_footage?: number;
  year_built?: number;
}

export default async function LandingPage() {
  let facilities: Facility[] = [];
  let fields: Field[] = [];
  
  try {
    // Load both facilities and fields in parallel
    const [facilitiesData, fieldsData] = await Promise.all([
      getFacilitiesForCurrentUser(),
      getAllFieldsForMap()
    ]);
    
    facilities = facilitiesData;
    fields = fieldsData;
    
    console.log(`Loaded ${facilities.length} facilities and ${fields.length} fields for landing`);
  } catch (error) {
    console.error('Failed to load data for landing:', error);
    // Provide fallback empty arrays
    facilities = [];
    fields = [];
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <LandingMapClient facilities={facilities} fields={fields} />
    </div>
  );
} 