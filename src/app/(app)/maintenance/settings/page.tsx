'use client';

import { ArrowLeft, Settings2, Bell, FileText, Users, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IssueTrackingSettings from '@/components/maintenance/IssueTrackingSettings';

export default function MaintenanceSettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Board
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Maintenance Settings</h1>
              <p className="text-gray-400 mt-1">Configure workflow, notifications, and forms</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="bg-gray-900 border-b border-gray-800 p-0 h-12 w-full flex space-x-2">
            <TabsTrigger 
              value="workflow"
              className="flex items-center gap-2 px-4 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              <Settings2 className="w-4 h-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="flex items-center gap-2 px-4 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="forms"
              className="flex items-center gap-2 px-4 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              <FileText className="w-4 h-4" />
              Forms
            </TabsTrigger>
            <TabsTrigger 
              value="teams"
              className="flex items-center gap-2 px-4 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              <Users className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="integrations"
              className="flex items-center gap-2 px-4 h-12 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 hover:text-white"
            >
              <Wrench className="w-4 h-4" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Workflow Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure how maintenance tasks move through different stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IssueTrackingSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure email and SMS notifications for different events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400">Notification settings coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Form Templates</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize maintenance request and assessment forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400">Form templates coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">Team Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage maintenance teams and assign responsibilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400">Team management coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">System Integrations</CardTitle>
                <CardDescription className="text-gray-400">
                  Connect with external systems and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400">Integration settings coming soon...</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 