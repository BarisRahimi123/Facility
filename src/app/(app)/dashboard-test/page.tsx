'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardTestPage() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    console.log('DashboardTestPage mounted');
    setLoaded(true);
    
    return () => {
      console.log('DashboardTestPage unmounted');
    };
  }, []);
  
  // Sample stats for testing
  const stats = [
    { label: 'Total Facilities', value: 12 },
    { label: 'Active Projects', value: 5 },
    { label: 'Pending Tasks', value: 24 },
    { label: 'Team Members', value: 8 }
  ];
  
  // Sample side panel for testing
  const SidePanel = () => (
    <div>
      <h3 className="font-medium mb-3">Activity Log</h3>
      <div className="space-y-3">
        <div className="border-b pb-2">
          <p className="text-sm">New task created</p>
          <p className="text-xs text-gray-500">Today, 10:30 AM</p>
        </div>
        <div className="border-b pb-2">
          <p className="text-sm">Project status updated</p>
          <p className="text-xs text-gray-500">Yesterday, 4:15 PM</p>
        </div>
        <div className="border-b pb-2">
          <p className="text-sm">New member added</p>
          <p className="text-xs text-gray-500">Mar 15, 2:42 PM</p>
        </div>
      </div>
    </div>
  );
  
  return (
    <DashboardLayout stats={stats} sidePanel={<SidePanel />}>
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Dashboard Layout Test</h1>
        
        <div className="bg-blue-50 p-4 rounded mb-6">
          <p className="text-sm">
            Component Loaded: <span className="font-medium">{loaded ? 'Yes' : 'No'}</span>
          </p>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-medium mb-2">Sample Content 1</h3>
            <p className="text-sm text-gray-600">
              This is a test page to verify that the DashboardLayout component is working properly.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded border">
            <h3 className="font-medium mb-2">Sample Content 2</h3>
            <p className="text-sm text-gray-600">
              Check that the stats and side panel are rendering correctly.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 