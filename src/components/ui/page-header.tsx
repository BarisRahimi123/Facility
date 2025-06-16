import React from 'react';
import { Breadcrumb } from './breadcrumb';
import { useFacility } from '@/contexts/FacilityContext';

interface PageHeaderProps {
  title: string;
  pageName: string;
}

export function PageHeader({ title, pageName }: PageHeaderProps) {
  const { currentFacility } = useFacility();

  const breadcrumbItems = [
    ...(currentFacility 
      ? [{ 
          label: currentFacility.name, 
          href: `/facilities/${currentFacility.id}` 
        }] 
      : []),
    { label: pageName }
  ];

  return (
    <div className="mb-6">
      <Breadcrumb items={breadcrumbItems} className="mb-2" />
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    </div>
  );
} 