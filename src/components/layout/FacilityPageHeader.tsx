import React from 'react';
import { FacilityBreadcrumb } from './FacilityBreadcrumb';
import { useFacility } from '@/contexts/FacilityContext';

interface FacilityPageHeaderProps {
  title: string;
  pageName: string;
}

export function FacilityPageHeader({ title, pageName }: FacilityPageHeaderProps) {
  const { currentFacility } = useFacility();

  return (
    <div className="mb-6">
      <FacilityBreadcrumb 
        facilityName={currentFacility?.name}
        facilityId={currentFacility?.id}
        pageName={pageName}
      />
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </div>
  );
} 