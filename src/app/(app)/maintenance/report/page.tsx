'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MaintenanceReportPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Maintenance Report</h1>
        <p className="mb-4">Please use a valid report link to access the maintenance report form.</p>
        <button 
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 