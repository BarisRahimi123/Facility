'use client';

import { useState, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components
const EmailSettings = lazy(() => import('@/components/settings/EmailSettings'));
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings'));

// Loading fallback component
const SettingsLoadingFallback = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-64 mb-6" />
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <Tabs 
        defaultValue="email" 
        className="space-y-6"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          <div className="max-w-4xl">
            {activeTab === 'email' && (
              <Suspense fallback={<SettingsLoadingFallback />}>
                <EmailSettings />
              </Suspense>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="max-w-4xl">
            {activeTab === 'notifications' && (
              <Suspense fallback={<SettingsLoadingFallback />}>
                <NotificationSettings />
              </Suspense>
            )}
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="text-center py-8 text-gray-500">
            Security settings coming soon
          </div>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="text-center py-8 text-gray-500">
            Integration settings coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 