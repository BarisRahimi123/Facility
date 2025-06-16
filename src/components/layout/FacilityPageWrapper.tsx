import React from 'react';
import { FacilityBreadcrumb } from './FacilityBreadcrumb';
import { useFacility } from '@/contexts/FacilityContext';

interface FacilityPageWrapperProps {
  pageName: string;
  children: React.ReactNode;
}

export function FacilityPageWrapper({ pageName, children }: FacilityPageWrapperProps) {
  const { currentFacility } = useFacility();

  return (
    <div className="space-y-6">
      <FacilityBreadcrumb 
        facilityName={currentFacility?.name}
        facilityId={currentFacility?.id}
        pageName={pageName}
      />
      {children}
    </div>
  );
} 