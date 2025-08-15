'use client';

import { useState, useEffect } from 'react';
import { getFolders } from '@/app/actions/documentFolders';

export default function TestFoldersPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFolders();
  }, []);

  const testFolders = async () => {
    try {
      setLoading(true);
      // Test with a known facility ID (Washington Elementary)
      const testFacilityId = 'e886edaf-0e7b-40b4-9a79-074ab496013a';
      const result = await getFolders(testFacilityId, 'facility');
      setFolders(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Folders Page</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {!loading && !error && (
        <div>
          <p className="mb-4">Found {folders.length} folders</p>
          <div className="grid gap-4">
            {folders.map((folder) => (
              <div key={folder.id} className="p-4 border rounded">
                <h3 className="font-bold">{folder.name}</h3>
                <p className="text-sm text-gray-600">{folder.description}</p>
                <p className="text-xs text-gray-500">Color: {folder.color}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
