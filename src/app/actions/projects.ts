'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import type { FacilityType } from '@/types/facility';

export async function createFacility(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const facilityType = formData.get('facilityType') as FacilityType;
  const totalSquareFootage = parseInt(formData.get('totalSquareFootage') as string);
  const numberOfFloors = parseInt(formData.get('numberOfFloors') as string);
  const yearBuilt = formData.get('yearBuilt') as string;
  const lastRenovationDate = formData.get('lastRenovationDate') as string;
  const facilityConditionIndex = parseInt(formData.get('facilityConditionIndex') as string);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('facilities')
    .insert({
      name,
      address,
      facility_type: facilityType,
      total_square_footage: totalSquareFootage,
      number_of_floors: numberOfFloors,
      year_built: yearBuilt,
      last_renovation_date: lastRenovationDate || null,
      facility_condition_index: facilityConditionIndex,
      status: 'active',
      created_by: session.user.id
    });

  if (error) throw error;
  
  redirect('/facilities');
}