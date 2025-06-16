'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FacilitySystem, FacilitySystemFormData } from '@/types/facility';
import FacilitySystemForm from '@/components/facility/FacilitySystemForm';
import FacilitySystemsTable from '@/components/facility/FacilitySystemsTable';
import MaintenanceCalendar from '@/components/facility/MaintenanceCalendar';
import ShareFormModal from '@/components/facility/ShareFormModal';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FormsPage() {
  const [systems, setSystems] = useState<FacilitySystem[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingSystem, setEditingSystem] = useState<FacilitySystem | null>(null);
  const [sharingSystem, setSharingSystem] = useState<string | null>(null);

  const handleAddSystem = async (data: FacilitySystemFormData) => {
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user?.id) throw new Error('You must be logged in to add a system');

      // Insert the system with created_by field
      const { error } = await supabase
        .from('facility_systems')
        .insert({
          ...data,
          created_by: session.user.id
        });
      
      if (error) throw error;
      
      // Refresh systems list
      const { data: updatedSystems } = await supabase
        .from('facility_systems')
        .select('*');
      
      if (updatedSystems) {
        setSystems(updatedSystems);
      }
      
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error adding system:', error);
      alert(error instanceof Error ? error.message : 'Failed to add system');
    }
  };

  const handleEditSystem = (system: FacilitySystem) => {
    setEditingSystem(system);
  };

  const handleUpdateSystem = async (data: FacilitySystemFormData) => {
    if (!editingSystem) return;
    
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user?.id) throw new Error('You must be logged in to update a system');

      const { error } = await supabase
        .from('facility_systems')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSystem.id)
        .eq('created_by', session.user.id); // Ensure user owns the record
      
      if (error) throw error;
      
      // Refresh systems list
      const { data: updatedSystems } = await supabase
        .from('facility_systems')
        .select('*');
      
      if (updatedSystems) {
        setSystems(updatedSystems);
      }
      
      setEditingSystem(null);
    } catch (error) {
      console.error('Error updating system:', error);
      alert(error instanceof Error ? error.message : 'Failed to update system');
    }
  };

  const handleDeleteSystem = async (systemId: string) => {
    if (!confirm('Are you sure you want to delete this system?')) return;
    
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user?.id) throw new Error('You must be logged in to delete a system');

      const { error } = await supabase
        .from('facility_systems')
        .delete()
        .eq('id', systemId)
        .eq('created_by', session.user.id); // Ensure user owns the record
      
      if (error) throw error;
      
      // Refresh systems list
      const { data: updatedSystems } = await supabase
        .from('facility_systems')
        .select('*');
      
      if (updatedSystems) {
        setSystems(updatedSystems);
      }
    } catch (error) {
      console.error('Error deleting system:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete system');
    }
  };

  const handleScheduleMaintenance = (systemId: string) => {
    // TODO: Navigate to maintenance scheduling page
    console.log('Schedule maintenance for system:', systemId);
  };

  const handleShare = (systemId: string) => {
    setSharingSystem(systemId);
  };

  // Load systems on mount
  useEffect(() => {
    const loadSystems = async () => {
      const { data, error } = await supabase
        .from('facility_systems')
        .select('*');
      
      if (error) {
        console.error('Error loading systems:', error);
        return;
      }
      
      if (data) {
        setSystems(data);
      }
    };
    
    loadSystems();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Facility Systems</h1>
        <Button onClick={() => setIsFormVisible(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add System
        </Button>
      </div>

      {isFormVisible && (
        <div className="mb-8">
          <FacilitySystemForm
            onSubmit={handleAddSystem}
            onCancel={() => setIsFormVisible(false)}
          />
        </div>
      )}

      {editingSystem && (
        <div className="mb-8">
          <FacilitySystemForm
            onSubmit={handleUpdateSystem}
            onCancel={() => setEditingSystem(null)}
            initialData={editingSystem}
          />
        </div>
      )}

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <FacilitySystemsTable
            systems={systems}
            onEdit={handleEditSystem}
            onDelete={handleDeleteSystem}
            onScheduleMaintenance={handleScheduleMaintenance}
            onShare={handleShare}
          />
        </TabsContent>
        <TabsContent value="calendar">
          <MaintenanceCalendar 
            systems={systems}
            onScheduleMaintenance={handleScheduleMaintenance}
          />
        </TabsContent>
      </Tabs>

      {sharingSystem && (
        <ShareFormModal
          formId={sharingSystem}
          onClose={() => setSharingSystem(null)}
        />
      )}
    </div>
  );
} 