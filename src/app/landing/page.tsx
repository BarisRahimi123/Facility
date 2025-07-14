import { Metadata } from 'next';
import { getFacilitiesForCurrentUser } from '@/app/actions/facilities';
import { getAllFieldsForMap, getFieldBlockoutsForLanding } from '@/app/actions/fields';
import { Facility } from '@/types/facility';
import { Field, FieldBlackoutDate } from '@/types/field';
import { LandingMapClient } from './LandingMapClient';

export const metadata: Metadata = {
  title: 'Book Facilities & Fields | FacilityCore',
  description: 'Find and book the perfect facility or field for your next event or activity',
};

export default async function LandingPage() {
  let facilities: Facility[] = [];
  let fields: Field[] = [];
  let fieldBlockouts: FieldBlackoutDate[] = [];
  
  try {
    // Load both facilities and fields in parallel
    const [facilitiesData, fieldsData] = await Promise.all([
      getFacilitiesForCurrentUser(),
      getAllFieldsForMap()
    ]);
    
    facilities = facilitiesData;
    fields = fieldsData;
    
    // If we have fields, get their blockout dates
    if (fields.length > 0) {
      const fieldIds = fields.map(f => f.id);
      const blockoutsResponse = await getFieldBlockoutsForLanding(fieldIds);
      fieldBlockouts = blockoutsResponse.data || [];
      
      console.log(`Loaded ${fieldBlockouts.length} blockout dates for ${fields.length} fields`);
    }
    
    console.log(`Loaded ${facilities.length} facilities and ${fields.length} fields for landing`);
  } catch (error) {
    console.error('Failed to load data for landing:', error);
    // Provide fallback empty arrays
    facilities = [];
    fields = [];
    fieldBlockouts = [];
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <LandingMapClient 
        facilities={facilities} 
        fields={fields} 
        fieldBlockouts={fieldBlockouts}
      />
    </div>
  );
} 