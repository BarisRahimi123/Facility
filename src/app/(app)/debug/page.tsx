'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function DebugPage() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-6">Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-medium mb-2">Current URL Information</h2>
          <div className="text-sm font-mono bg-black text-white p-3 rounded">
            <div>Current pathname: {pathname}</div>
            <div>Mounted: {mounted ? 'Yes' : 'No'}</div>
            <div>Window location: {mounted ? window.location.href : 'Not available before mount'}</div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-medium mb-2">Route Groups</h2>
          <p className="mb-2">
            The app uses Next.js route groups (parentheses in folder names), which don't affect URL paths
            but can organize routes differently in the file system.
          </p>
          <div className="text-sm font-mono bg-black text-white p-3 rounded">
            <div>Dashboard URL: /dashboard</div>
            <div>File system path: /src/app/(app)/dashboard/page.tsx</div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-medium mb-2">Navigation Test Links</h2>
          <div className="grid grid-cols-2 gap-2">
            <a href="/dashboard" className="bg-blue-500 text-white p-2 rounded text-center">Dashboard</a>
            <a href="/facilities" className="bg-blue-500 text-white p-2 rounded text-center">Facilities</a>
            <a href="/buildings" className="bg-blue-500 text-white p-2 rounded text-center">Buildings</a>
            <a href="/plans" className="bg-blue-500 text-white p-2 rounded text-center">Plans</a>
            <a href="/virtual-tour" className="bg-blue-500 text-white p-2 rounded text-center">Virtual Tour</a>
            <a href="/maintenance" className="bg-blue-500 text-white p-2 rounded text-center">Maintenance</a>
          </div>
        </div>
      </div>
    </div>
  );
} 