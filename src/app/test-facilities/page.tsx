'use client';

import { useState, useEffect } from 'react';
import { getAllFacilities } from '@/app/actions/facilities';

export default function TestFacilitiesPage() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFacilities() {
      try {
        console.log('Loading facilities...');
        const data = await getAllFacilities();
        console.log('Facilities loaded:', data);
        setFacilities(data);
      } catch (error) {
        console.error('Error loading facilities:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    loadFacilities();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Facilities Page</h1>
        <p>Loading facilities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Test Facilities Page</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Facilities Page</h1>
      <p className="mb-4">Found {facilities.length} facilities:</p>
      
      {facilities.length > 0 ? (
        <div className="space-y-4">
          {facilities.map((facility, index) => (
            <div key={facility.id || index} className="border p-4 rounded">
              <h3 className="font-bold">{facility.name}</h3>
              <p>Type: {facility.facility_type}</p>
              <p>Address: {facility.address}</p>
              <p>Status: {facility.status}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No facilities found.</p>
      )}
      
      <div className="mt-8">
        <a href="/facilities" className="text-blue-600 hover:underline">
          Go to main facilities page
        </a>
      </div>
    </div>
  );
} 