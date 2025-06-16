'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FacilityBreadcrumb } from './FacilityBreadcrumb';
import { useFacility } from '@/contexts/FacilityContext';

interface ClientBreadcrumbWrapperProps {
  className?: string;
}

export default function ClientBreadcrumbWrapper({ className }: ClientBreadcrumbWrapperProps) {
  const pathname = usePathname();
  const { currentFacility } = useFacility();
  const [mounted, setMounted] = useState(false);
  
  // Extract the current page name from the pathname
  const getPageName = () => {
    const path = (pathname || '').split('/').filter(Boolean);
    if (path.length === 0) return 'Dashboard';
    
    // Get the last segment and capitalize it
    const lastSegment = path[path.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-6 bg-gray-200 animate-pulse rounded ${className}`}></div>;
  }

  return (
    <FacilityBreadcrumb 
      facilityName={currentFacility?.name}
      facilityId={currentFacility?.id}
      pageName={getPageName()}
      className={className}
    />
  );
} 