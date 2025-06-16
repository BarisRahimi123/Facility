'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface FacilityBreadcrumbProps {
  facilityName?: string;
  facilityId?: string;
  pageName: string;
  className?: string;
}

export function FacilityBreadcrumb({ 
  facilityName, 
  facilityId, 
  pageName, 
  className = '' 
}: FacilityBreadcrumbProps) {
  // Safe fallbacks for undefined values
  const safeFacilityName = facilityName || '';
  const safeFacilityId = facilityId || '';
  const safePageName = pageName || 'Page';

  // Safety check for client-side environment
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // If not mounted yet, show a simplified version
  if (!mounted) {
    return (
      <nav className={`flex items-center text-sm text-gray-500 mb-4 ${className}`}>
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
      </nav>
    );
  }

  return (
    <nav className={`flex items-center text-sm text-gray-500 mb-4 ${className}`} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </li>
        
        {safeFacilityName && (
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {safeFacilityId ? (
                <Link 
                  href={`/facilities/${safeFacilityId}`} 
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                >
                  {safeFacilityName}
                </Link>
              ) : (
                <span className="ml-1 text-sm font-medium text-gray-700 md:ml-2">
                  {safeFacilityName}
                </span>
              )}
            </div>
          </li>
        )}
        
        <li aria-current="page">
          <div className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
              {safePageName}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );
} 