'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarDays, 
  Building2, 
  Users, 
  Clock,
  Plus,
  Calendar,
  MapPin,
  TrendingUp,
  AlertCircle,
  Ban,
  Grid3X3,
  Home,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { StaffDashboardData, FacilityWithFields, FieldWithBlockouts, RoomWithBlockouts } from '@/types/staff';
import StaffCalendarView from '@/components/staff/StaffCalendarView';
import CreateBlockoutModal from '@/components/staff/CreateBlockoutModal';

// Sample demo data for admin users
const createDemoData = (): StaffDashboardData => {
  const sampleFields: FieldWithBlockouts[] = [
    {
      id: 'demo-field-1',
      name: 'Soccer Field A',
      type: 'Soccer',
      status: 'active',
      hourly_rate: 85,
      facility_id: 'demo-facility-1',
      facility_name: 'Central Sports Complex',
      blockouts: []
    },
    {
      id: 'demo-field-2',
      name: 'Basketball Court 1',
      type: 'Basketball',
      status: 'active',
      hourly_rate: 45,
      facility_id: 'demo-facility-1',
      facility_name: 'Central Sports Complex',
      blockouts: []
    },
    {
      id: 'demo-field-3',
      name: 'Tennis Court A',
      type: 'Tennis',
      status: 'active',
      hourly_rate: 35,
      facility_id: 'demo-facility-2',
      facility_name: 'Westside Recreation Center',
      blockouts: []
    }
  ];

  const sampleRooms: RoomWithBlockouts[] = [
    {
      id: 'demo-room-1',
      number: '101',
      type: 'Conference Room',
      building_id: 'demo-building-1',
      building_name: 'Main Building',
      facility_id: 'demo-facility-1',
      facility_name: 'Central Sports Complex',
      blockouts: []
    },
    {
      id: 'demo-room-2',
      number: '205',
      type: 'Meeting Room',
      building_id: 'demo-building-2',
      building_name: 'Admin Building',
      facility_id: 'demo-facility-2',
      facility_name: 'Westside Recreation Center',
      blockouts: []
    }
  ];

  const sampleFacilities: FacilityWithFields[] = [
    {
      id: 'demo-facility-1',
      name: 'Central Sports Complex',
      address: '123 Sports Drive, Downtown',
      facility_type: 'Sports Complex',
      status: 'active',
      fields: sampleFields.filter(f => f.facility_id === 'demo-facility-1')
    },
    {
      id: 'demo-facility-2',
      name: 'Westside Recreation Center',
      address: '456 Recreation Blvd, Westside',
      facility_type: 'Recreation Center',
      status: 'active',
      fields: sampleFields.filter(f => f.facility_id === 'demo-facility-2')
    }
  ];

  const sampleBlockouts = [
    {
      id: 'demo-blockout-1',
      field_id: 'demo-field-1',
      created_by: 'demo-user',
      start_date: '2025-01-26',
      end_date: '2025-01-26',
      start_time: '14:00',
      end_time: '16:00',
      reason: 'Maintenance',
      description: 'Field irrigation system maintenance',
      recurring: false,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'demo-blockout-2',
      room_id: 'demo-room-1',
      created_by: 'demo-user',
      start_date: '2025-01-27',
      end_date: '2025-01-27',
      start_time: '09:00',
      end_time: '12:00',
      reason: 'Staff Meeting',
      description: 'Monthly staff coordination meeting',
      recurring: false,
      status: 'active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  return {
    assignments: [],
    field_assignments: [],
    room_assignments: [],
    facilities: sampleFacilities,
    assigned_fields: sampleFields,
    assigned_rooms: sampleRooms,
    upcoming_blockouts: sampleBlockouts,
    recent_reservations: []
  };
};

// Client-side function to get staff dashboard data
async function getStaffDashboardData(): Promise<{ data: StaffDashboardData | null; error: string | null }> {
  try {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get staff assignments with facility and field data
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_facility_assignments')
      .select(`
        *,
        facilities (
          id,
          name,
          address,
          facility_type,
          status,
          fields (
            id,
            name,
            type,
            status,
            hourly_rate
          )
        )
      `)
      .eq('user_id', user.id);

    if (assignmentsError) {
      return { data: null, error: assignmentsError.message };
    }

    // Get field assignments
    const { data: fieldAssignments, error: fieldAssignmentsError } = await supabase
      .from('staff_field_assignments')
      .select(`
        *,
        fields (
          id,
          name,
          type,
          status,
          hourly_rate,
          facility_id,
          facilities (
            name
          )
        )
      `)
      .eq('user_id', user.id);

    if (fieldAssignmentsError) {
      console.error('Error fetching field assignments:', fieldAssignmentsError);
    }

    // Get room assignments
    const { data: roomAssignments, error: roomAssignmentsError } = await supabase
      .from('staff_room_assignments')
      .select(`
        *,
        rooms (
          id,
          number,
          type,
          building_id,
          buildings (
            name,
            facility_id,
            facilities (
              name
            )
          )
        )
      `)
      .eq('user_id', user.id);

    if (roomAssignmentsError) {
      console.error('Error fetching room assignments:', roomAssignmentsError);
    }

    // Get upcoming field blockouts for assigned fields
    const fieldIds = fieldAssignments?.map((a: any) => a.field_id) || [];
    let fieldBlockouts: any[] = [];
    if (fieldIds.length > 0) {
      const { data: fieldBlockoutsData, error: fieldBlockoutsError } = await supabase
        .from('field_blockout_dates')
        .select(`
          *,
          fields (
            id,
            name,
            facility_id
          )
        `)
        .in('field_id', fieldIds)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(10);

      if (fieldBlockoutsError) {
        console.error('Error fetching field blockouts:', fieldBlockoutsError);
      } else {
        fieldBlockouts = fieldBlockoutsData || [];
      }
    }

    // Get upcoming room blockouts for assigned rooms
    const roomIds = roomAssignments?.map((a: any) => a.room_id) || [];
    let roomBlockouts: any[] = [];
    if (roomIds.length > 0) {
      const { data: roomBlockoutsData, error: roomBlockoutsError } = await supabase
        .from('room_blockout_dates')
        .select(`
          *,
          rooms (
            id,
            number,
            building_id,
            buildings (
              name,
              facility_id,
              facilities (
                name
              )
            )
          )
        `)
        .in('room_id', roomIds)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(10);

      if (roomBlockoutsError) {
        console.error('Error fetching room blockouts:', roomBlockoutsError);
      } else {
        roomBlockouts = roomBlockoutsData || [];
      }
    }

    // Get recent reservations (mock for now)
    const recentReservations: any[] = [];

    // Transform data
    const facilities = assignments?.map((assignment: any) => ({
      id: assignment.facilities.id,
      name: assignment.facilities.name,
      address: assignment.facilities.address,
      facility_type: assignment.facilities.facility_type,
      status: assignment.facilities.status,
      fields: assignment.facilities.fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        status: field.status,
        hourly_rate: field.hourly_rate,
        facility_id: assignment.facilities.id,
        blockouts: []
      }))
    })) || [];

    // Transform assigned fields
    const assignedFields = fieldAssignments?.map((assignment: any) => ({
      id: assignment.fields.id,
      name: assignment.fields.name,
      type: assignment.fields.type,
      status: assignment.fields.status,
      hourly_rate: assignment.fields.hourly_rate,
      facility_id: assignment.fields.facility_id,
      facility_name: assignment.fields.facilities.name,
      blockouts: []
    })) || [];

    // Transform assigned rooms
    const assignedRooms = roomAssignments?.map((assignment: any) => ({
      id: assignment.rooms.id,
      number: assignment.rooms.number,
      type: assignment.rooms.type,
      building_id: assignment.rooms.building_id,
      building_name: assignment.rooms.buildings.name,
      facility_id: assignment.rooms.buildings.facility_id,
      facility_name: assignment.rooms.buildings.facilities.name,
      blockouts: []
    })) || [];

    const dashboardData: StaffDashboardData = {
      assignments: assignments || [],
      field_assignments: fieldAssignments || [],
      room_assignments: roomAssignments || [],
      facilities,
      assigned_fields: assignedFields,
      assigned_rooms: assignedRooms,
      upcoming_blockouts: [...fieldBlockouts, ...roomBlockouts],
      recent_reservations: recentReservations
    };

    return { data: dashboardData, error: null };
  } catch (error) {
    console.error('Error in getStaffDashboardData:', error);
    return { data: null, error: 'Failed to fetch dashboard data' };
  }
}

export default function StaffDashboard() {
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithFields | null>(null);
  const [selectedField, setSelectedField] = useState<FieldWithBlockouts | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBlockouts | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'fields' | 'rooms'>('overview');
  const [isCreateBlockoutOpen, setIsCreateBlockoutOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const response = await getStaffDashboardData();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        // Check if user has any assignments
        const hasAssignments = response.data.facilities.length > 0 || 
                             response.data.assigned_fields.length > 0 || 
                             response.data.assigned_rooms.length > 0;
        
        if (hasAssignments) {
          setDashboardData(response.data);
          setIsDemoMode(false);
          // Set default selections
          if (response.data.facilities.length && !selectedFacility) {
            setSelectedFacility(response.data.facilities[0]);
          }
          if (response.data.assigned_fields.length && !selectedField) {
            setSelectedField(response.data.assigned_fields[0]);
          }
          if (response.data.assigned_rooms.length && !selectedRoom) {
            setSelectedRoom(response.data.assigned_rooms[0]);
          }
        } else {
          // Show demo data for admin users with no assignments
          const demoData = createDemoData();
          setDashboardData(demoData);
          setIsDemoMode(true);
          setSelectedFacility(demoData.facilities[0]);
          setSelectedField(demoData.assigned_fields[0]);
          setSelectedRoom(demoData.assigned_rooms[0]);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockoutCreated = () => {
    setIsCreateBlockoutOpen(false);
    if (!isDemoMode) {
      loadDashboardData(); // Only refresh real data
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadDashboardData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              Unable to load dashboard data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Staff Dashboard</h1>
              <p className="text-muted-foreground">Manage your assigned facilities, fields, and rooms</p>
            </div>
            {isDemoMode && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-500 font-medium">Demo Mode</span>
              </div>
            )}
          </div>
          
          {isDemoMode && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Demo Mode Active</p>
                  <p className="text-sm text-blue-600 mt-1">
                    You're viewing sample staff dashboard data. To see real assignments, staff members need to be assigned to specific facilities, fields, or rooms through the People Management system.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="facilities">Facilities ({dashboardData.facilities.length})</TabsTrigger>
            <TabsTrigger value="fields">Fields ({dashboardData.assigned_fields.length})</TabsTrigger>
            <TabsTrigger value="rooms">Rooms ({dashboardData.assigned_rooms.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Facilities</p>
                      <p className="text-2xl font-bold">{dashboardData.facilities.length}</p>
                    </div>
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Fields</p>
                      <p className="text-2xl font-bold">{dashboardData.assigned_fields.length}</p>
                    </div>
                    <Grid3X3 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Rooms</p>
                      <p className="text-2xl font-bold">{dashboardData.assigned_rooms.length}</p>
                    </div>
                    <Home className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Blockouts</p>
                      <p className="text-2xl font-bold">{dashboardData.upcoming_blockouts.length}</p>
                    </div>
                    <Ban className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Facilities Overview */}
              {dashboardData.facilities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building2 className="h-5 w-5" />
                      My Facilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.facilities.slice(0, 3).map((facility) => (
                      <div key={facility.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{facility.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {facility.fields.length} fields
                        </p>
                      </div>
                    ))}
                    {dashboardData.facilities.length > 3 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab('facilities')}
                      >
                        View All ({dashboardData.facilities.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Fields Overview */}
              {dashboardData.assigned_fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Grid3X3 className="h-5 w-5" />
                      My Fields
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.assigned_fields.slice(0, 3).map((field) => (
                      <div key={field.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{field.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {field.type} • ${field.hourly_rate}/hr
                        </p>
                        {field.facility_name && (
                          <p className="text-xs text-muted-foreground">{field.facility_name}</p>
                        )}
                      </div>
                    ))}
                    {dashboardData.assigned_fields.length > 3 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab('fields')}
                      >
                        View All ({dashboardData.assigned_fields.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Rooms Overview */}
              {dashboardData.assigned_rooms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Home className="h-5 w-5" />
                      My Rooms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.assigned_rooms.slice(0, 3).map((room) => (
                      <div key={room.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">Room {room.number}</h4>
                        <p className="text-xs text-muted-foreground">
                          {room.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {room.building_name} • {room.facility_name}
                        </p>
                      </div>
                    ))}
                    {dashboardData.assigned_rooms.length > 3 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setActiveTab('rooms')}
                      >
                        View All ({dashboardData.assigned_rooms.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Upcoming Blockouts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Blockouts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData.upcoming_blockouts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dashboardData.upcoming_blockouts.slice(0, 6).map((blockout) => (
                      <div key={blockout.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Ban className="h-3 w-3 text-red-500" />
                          <span className="font-medium text-sm">{blockout.reason}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(blockout.start_date), 'MMM d')} - {format(new Date(blockout.end_date), 'MMM d')}
                        </p>
                        {blockout.start_time && (
                          <p className="text-xs text-muted-foreground">
                            {blockout.start_time} - {blockout.end_time}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No upcoming blockouts</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Facility List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      My Facilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dashboardData.facilities.map((facility) => (
                      <div
                        key={facility.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedFacility?.id === facility.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedFacility(facility)}
                      >
                        <h4 className="font-medium text-foreground">{facility.name}</h4>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{facility.address}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {facility.facility_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {facility.fields.length} fields
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Calendar Management */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Calendar Management - {selectedFacility?.name || 'Select a facility'}
                      </CardTitle>
                      <Button 
                        onClick={() => setIsCreateBlockoutOpen(true)} 
                        disabled={!selectedFacility || isDemoMode}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Blockout
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedFacility ? (
                      isDemoMode ? (
                        <div className="text-center py-12 space-y-4">
                          <Calendar className="h-16 w-16 text-muted-foreground mx-auto" />
                          <div>
                            <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                            <p className="text-muted-foreground">
                              In the actual staff dashboard, this would show an interactive calendar with field availability, 
                              reservations, and blockout management for <strong>{selectedFacility.name}</strong>.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <StaffCalendarView
                          facility={selectedFacility}
                          onBlockoutCreated={handleBlockoutCreated}
                        />
                      )
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Select a facility to view calendar
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.assigned_fields.map((field) => (
                <Card key={field.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Grid3X3 className="h-5 w-5" />
                      {field.name}
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {field.type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-medium">${field.hourly_rate}/hour</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="secondary" className="text-xs">{field.status}</Badge>
                    </div>
                    {field.facility_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Facility:</span>
                        <span className="text-xs">{field.facility_name}</span>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      disabled={isDemoMode}
                      onClick={() => {
                        setSelectedField(field);
                        setIsCreateBlockoutOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {isDemoMode ? 'Demo Mode' : 'Add Blockout'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {dashboardData.assigned_fields.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No fields assigned to you yet
                </div>
              )}
            </div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.assigned_rooms.map((room) => (
                <Card key={room.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Home className="h-5 w-5" />
                      Room {room.number}
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {room.type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Building:</span>
                      <span className="text-xs">{room.building_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Facility:</span>
                      <span className="text-xs">{room.facility_name}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      disabled={isDemoMode}
                      onClick={() => {
                        setSelectedRoom(room);
                        setIsCreateBlockoutOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {isDemoMode ? 'Demo Mode' : 'Add Blockout'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
              
              {dashboardData.assigned_rooms.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No rooms assigned to you yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Blockout Modal */}
        {!isDemoMode && (
          <CreateBlockoutModal
            isOpen={isCreateBlockoutOpen}
            onClose={() => setIsCreateBlockoutOpen(false)}
            onSuccess={handleBlockoutCreated}
            facility={selectedFacility}
          />
        )}
      </div>
    </div>
  );
} 