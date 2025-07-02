import { getFacilitiesForCurrentUser } from '@/app/actions/facilities';
import { getAllFieldsForMap } from '@/app/actions/fields';
import { FacilitiesMapClient } from './FacilitiesMapClient';
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

export default async function FacilitiesMapPage() {
  let facilities: Facility[] = [];
  let fields: Field[] = [];
  
  try {
    // Load both facilities and fields in parallel with role-based filtering
    const [facilitiesData, fieldsData] = await Promise.all([
      getFacilitiesForCurrentUser(),
      getAllFieldsForMap()
    ]);
    
    facilities = facilitiesData;
    fields = fieldsData;
    
    console.log(`Loaded ${facilities.length} facilities and ${fields.length} fields for map`);
  } catch (error) {
    console.error('Failed to load data for map:', error);
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Full width side-by-side layout */}
      <div className="flex-1 flex overflow-hidden">
        <FacilitiesMapClient facilities={facilities} fields={fields} />
      </div>
    </div>
  );
} 