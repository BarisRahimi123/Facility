import React from 'react';
import { getFolders } from '@/app/actions/plans';
import Link from 'next/link';
import CreateFolderDialog from '@/components/plans/CreateFolderDialog';

export const metadata = {
  title: 'Plans | Fieldwire',
  description: 'Manage your facility plans and documents',
};

export default async function PlansPage() {
  const folders = await getFolders();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Plans</h1>
        <CreateFolderDialog />
      </div>

      {folders.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
          <h3 className="text-lg font-medium text-gray-300 mb-2">No folders yet</h3>
          <p className="text-gray-400 mb-4">Get started by creating a folder to organize your plans</p>
          <CreateFolderDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <Link 
              key={folder.id} 
              href={`/plans/${folder.id}`}
              className="block bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
            >
              <h3 className="font-semibold text-lg mb-2 text-white">{folder.name}</h3>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span className="capitalize">{folder.discipline.replace('_', ' ')} | {folder.phase.replace('_', ' ')}</span>
                <span>{folder.item_count} {folder.item_count === 1 ? 'item' : 'items'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 