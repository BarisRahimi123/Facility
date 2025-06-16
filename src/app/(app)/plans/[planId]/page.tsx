import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFolders, getPlans } from '@/app/actions/plans';
import UploadPlanButton from '@/components/plans/UploadPlanButton';
import PlansList from '@/components/plans/PlansList';

interface FolderPageProps {
  params: {
    planId: string;
  };
}

export async function generateMetadata({ params }: FolderPageProps) {
  const folders = await getFolders();
  const folder = folders.find(f => f.id === params.planId);
  
  if (!folder) {
    return {
      title: 'Folder Not Found | Fieldwire',
      description: 'The requested folder could not be found',
    };
  }
  
  return {
    title: `${folder.name} Plans | Fieldwire`,
    description: `${folder.discipline} plans for ${folder.name}`,
  };
}

export default async function FolderPage({ params }: FolderPageProps) {
  const folders = await getFolders();
  const folder = folders.find(f => f.id === params.planId);
  
  if (!folder) {
    notFound();
  }
  
  const plans = await getPlans(params.planId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/plans" className="hover:underline hover:text-purple-400 transition-colors">Plans</Link>
            <span>/</span>
            <span className="text-gray-300">{folder.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{folder.name}</h1>
          <div className="text-sm text-gray-400 mt-1">
            <span className="capitalize">{folder.discipline.replace('_', ' ')}</span> | <span className="capitalize">{folder.phase.replace('_', ' ')}</span>
          </div>
        </div>
        
        <UploadPlanButton folderId={params.planId} />
      </div>

      {plans.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
          <h3 className="text-lg font-medium text-gray-300 mb-2">No plans in this folder</h3>
          <p className="text-gray-400 mb-4">Upload plans to get started</p>
          <UploadPlanButton folderId={params.planId} />
        </div>
      ) : (
        <PlansList plans={plans} folderId={params.planId} />
      )}
    </div>
  );
} 