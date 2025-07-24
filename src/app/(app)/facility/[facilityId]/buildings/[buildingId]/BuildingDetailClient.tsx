'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Home, Building2, Plus, Wrench, Hammer, Edit2, Trash2, Camera, UserPlus } from 'lucide-react';
import AddRoomModal from '@/components/building/AddRoomModal';
import EditRoomModal from '@/components/building/EditRoomModal';
import AddSystemModal from '@/components/building/AddSystemModal';
import EditSystemModal from '@/components/building/EditSystemModal';
import AddRenovationModal from '@/components/building/AddRenovationModal';
import EditRenovationModal from '@/components/building/EditRenovationModal';
import EditBuildingModal from '@/components/building/EditBuildingModal';
import DocumentsList from '@/components/documents/DocumentsList';
import { BuildingPhotos } from '@/components/building/BuildingPhotos';
import ComplianceCalculator from '@/components/building/ComplianceCalculator';
import { deleteRoom, deleteBuildingSystem, deleteRenovation } from '@/app/actions/buildings';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import AssignStaffToRoomModal from '@/components/facility/AssignStaffToRoomModal';
import MaintenanceRequestList from '@/components/maintenance/MaintenanceRequestList';
import AddMaintenanceRequestForm from '@/components/building/AddMaintenanceRequestForm';
import { MaintenanceRequest, MaintenanceType, MaintenancePriority, MaintenanceStatus } from '@/types/maintenance';
import { createMaintenanceRequest, updateMaintenanceRequest } from '@/app/actions/maintenance';
import { Room, BuildingSystem, Renovation, Building as IBuilding, BuildingStatus } from '@/types/building';
import { Database } from '@/lib/database.types';
import { BuildingCalendar } from '@/components/calendar/BuildingCalendar';

type Room = Database['public']['Tables']['rooms']['Row'];

interface MaintenanceFormValues {
  title: string;
  description: string;
  type: MaintenanceType;
  priority: MaintenancePriority;
  due_date?: Date;
  estimated_cost?: number;
  room_id?: string;
  system_id?: string;
}

interface Building {
  id: string;
  facility_id: string;
  name: string;
  building_number: string;
  building_type: BuildingType;
  construction_date: string | null;
  square_footage: number;
  number_of_rooms: number;
  status: BuildingStatus;
  notes: string | null;
  image_url?: string;
  image_description?: string;
  boys_toilets?: number;
  girls_toilets?: number;
  unisex_toilets?: number;
  boys_urinals?: number;
  girls_urinals?: number;
  boys_sinks?: number;
  girls_sinks?: number;
  unisex_sinks?: number;
  boys_restrooms_count?: number;
  girls_restrooms_count?: number;
  unisex_restrooms_count?: number;
  staff_toilets?: number;
  staff_sinks?: number;
  staff_restrooms_count?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  rooms?: Room[];
  building_systems?: BuildingSystem[];
  maintenance_requests?: MaintenanceRequest[];
  renovations?: Renovation[];
  year_built?: number;
}

interface BuildingDetailClientProps {
  building: Building;
  facility: {
    id: string;
    name: string;
  };
  facilityId: string;
  buildingId: string;
}

export default function BuildingDetailClient({ 
  building, 
  facility, 
  facilityId, 
  buildingId 
}: BuildingDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
  const [isEditSystemModalOpen, setIsEditSystemModalOpen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<any>(null);
  const [isRenovationModalOpen, setIsRenovationModalOpen] = useState(false);
  const [isEditRenovationModalOpen, setIsEditRenovationModalOpen] = useState(false);
  const [selectedRenovation, setSelectedRenovation] = useState<any>(null);
  const [isEditBuildingModalOpen, setIsEditBuildingModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentCount, setStudentCount] = useState(300); // Default value for demo
  const [staffCount, setStaffCount] = useState(25); // Default value for demo

  // Room staff assignment modal state
  const [assigningStaffRoom, setAssigningStaffRoom] = useState<any>(null);
  const [isRoomStaffAssignModalOpen, setIsRoomStaffAssignModalOpen] = useState(false);

  // Maintenance modal state
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isEditMaintenanceModalOpen, setIsEditMaintenanceModalOpen] = useState(false);

  const handleDeleteRoom = async (room: any) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete Room ${room.room_number}? This action cannot be undone.`
    );

    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await deleteRoom(room.id);
      toast({
        title: 'Room deleted',
        description: `Room ${room.room_number} has been deleted successfully.`,
        variant: 'success',
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: 'Failed to delete room',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSystem = async (system: any) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete system "${system.name}"? This action cannot be undone.`
    );

    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await deleteBuildingSystem(system.id);
      toast({
        title: 'System deleted',
        description: `${system.name} has been deleted successfully.`,
        variant: 'success',
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting system:', error);
      toast({
        title: 'Failed to delete system',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRenovation = async (renovation: any) => {
    if (!window.confirm('Are you sure you want to delete this renovation record?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteRenovation(renovation.id);
      toast({
        title: "Renovation deleted",
        description: "The renovation record has been deleted successfully."
      });
      window.location.reload(); // Refresh to update the data
    } catch (error) {
      console.error('Error deleting renovation:', error);
      toast({
        title: "Error",
        description: "Failed to delete renovation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignStaffToRoom = (room: any) => {
    setAssigningStaffRoom(room);
    setIsRoomStaffAssignModalOpen(true);
  };

  const handleMaintenanceSubmit = async (data: MaintenanceFormValues) => {
    try {
      const result = await createMaintenanceRequest({
        ...data,
        facility_id: facilityId,
        building_id: buildingId,
        requested_by: 'current_user', // This will be replaced by the actual user ID by the server action
        due_date: data.due_date?.toISOString(),
        status: 'pending' as MaintenanceStatus,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'Success',
        description: 'Maintenance request created successfully.',
      });

      setIsMaintenanceModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error submitting maintenance request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit maintenance request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditMaintenanceRequest = async (request: MaintenanceRequest, formData: MaintenanceFormValues) => {
    try {
      const result = await updateMaintenanceRequest(request.id, {
        ...formData,
        due_date: formData.due_date?.toISOString(),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'Success',
        description: 'Maintenance request updated successfully.',
      });

      setIsEditMaintenanceModalOpen(false);
      setSelectedRequest(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating maintenance request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update maintenance request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/facilities" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <Home className="w-4 h-4 mr-2" />
              Facilities
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link 
                href={`/facility/${facilityId}`}
                className="ml-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors md:ml-2"
              >
                {facility?.name || 'Facility'}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <span className="ml-1 text-sm font-medium text-foreground md:ml-2">
                {building.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{building.name}</h1>
            <div className="flex items-center mt-2 space-x-2">
              <Badge 
                variant={building.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {building.status}
              </Badge>
              {building.building_number && (
                <span className="text-sm text-muted-foreground">Building #{building.building_number}</span>
              )}
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => setIsEditBuildingModalOpen(true)}
          >
            Edit Building
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="renovations">Renovations</TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Building Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{building.building_type?.replace('_', ' ') || 'N/A'}</div>
                <p className="text-xs text-muted-foreground mt-1">Classification</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Square Footage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{building.square_footage?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Area</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Building Age</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    if (!building.construction_date && !building.year_built) return 'Unknown';
                    
                    const currentYear = new Date().getFullYear();
                    let buildingYear = null;
                    
                    if (building.year_built) {
                      buildingYear = parseInt(building.year_built.toString());
                    } else if (building.construction_date) {
                      const constructionDate = new Date(building.construction_date);
                      if (!isNaN(constructionDate.getTime())) {
                        buildingYear = constructionDate.getFullYear();
                      }
                    }
                    
                    if (!buildingYear || buildingYear > currentYear || buildingYear < 1800) {
                      return 'Unknown';
                    }
                    
                    const ageInYears = currentYear - buildingYear;
                    
                    if (ageInYears === 0) {
                      return '< 1 year';
                    } else if (ageInYears === 1) {
                      return '1 year';
                    } else {
                      return `${ageInYears} years`;
                    }
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {building.construction_date ? 
                    `Built ${new Date(building.construction_date).toLocaleDateString()}` :
                    building.year_built ? 
                      `Built in ${building.year_built}` :
                      'Construction date unknown'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{building.rooms?.length || building.number_of_rooms || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Rooms</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Building Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Building Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{building.building_systems?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {building.building_systems?.filter((s: any) => s.status === 'operational').length || 0} Operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Renovations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{building.renovations?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {building.renovations?.filter((r: any) => r.status === 'completed').length || 0} Completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {building.rooms?.reduce((sum: number, room: any) => sum + (room.capacity || 0), 0)?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">People</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Space Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalCapacity = building.rooms?.reduce((sum: number, room: any) => sum + (room.capacity || 0), 0) || 0;
                    const totalArea = building.square_footage || 0;
                    if (totalArea === 0) return 'N/A';
                    const efficiency = (totalCapacity / totalArea * 100).toFixed(1);
                    return `${efficiency}%`;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">People per 100 sq ft</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Building Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Construction Date</h3>
                  <p className="mt-1">{building.construction_date ? new Date(building.construction_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Year Built</h3>
                  <p className="mt-1">{building.year_built || 'N/A'}</p>
                </div>
              </div>
              {building.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="mt-1 text-sm">{building.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Calculator */}
          <div className="mt-6">
            <ComplianceCalculator 
              rooms={building.rooms || []}
              buildingType={building.building_type || 'general'}
              studentCount={studentCount}
              staffCount={staffCount}
              building={building}
              onUpdateCounts={(newStudentCount, newStaffCount) => {
                setStudentCount(newStudentCount);
                setStaffCount(newStaffCount);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rooms</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRoomModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {building.rooms && building.rooms.length > 0 ? (
                <>
                  {/* Rooms Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Rooms</p>
                      <p className="text-2xl font-bold">{building.rooms.length}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Area</p>
                      <p className="text-2xl font-bold">
                        {building.rooms.reduce((sum: number, r: any) => sum + (r.square_footage || 0), 0).toLocaleString()}
                        <span className="text-sm text-muted-foreground ml-1">sq ft</span>
                      </p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Capacity</p>
                      <p className="text-2xl font-bold">
                        {building.rooms.reduce((sum: number, r: any) => sum + (r.capacity || 0), 0).toLocaleString()}
                        <span className="text-sm text-muted-foreground ml-1">people</span>
                      </p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Room Types</p>
                      <p className="text-2xl font-bold">
                        {new Set(building.rooms.map((r: any) => r.room_function).filter(Boolean)).size}
                      </p>
                    </div>
                  </div>

                  {/* Rooms Table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Room Number</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Function</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Floor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Area (sq ft)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Capacity</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Utilization</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {building.rooms.map((room: any) => {
                          const utilizationRate = room.capacity && room.square_footage ? 
                            (room.capacity / room.square_footage * 100).toFixed(1) : null;
                          
                          return (
                            <tr key={room.id} className="border-b hover:bg-accent/50 transition-colors">
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-primary" />
                                  <div>
                                    <div className="font-medium">Room {room.room_number}</div>
                                    {room.name && room.name !== room.room_number && (
                                      <div className="text-xs text-muted-foreground">{room.name}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    room.room_function === 'Classroom' ? 'border-blue-500 text-blue-400' :
                                    room.room_function === 'Office' ? 'border-green-500 text-green-400' :
                                    room.room_function === 'Laboratory' ? 'border-purple-500 text-purple-400' :
                                    room.room_function === 'Conference' ? 'border-yellow-500 text-yellow-400' :
                                    ''
                                  }`}
                                >
                                  {room.room_function || 'General'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {room.floor ? (
                                  <Badge variant="outline" className="text-xs">
                                    Floor {room.floor}
                                  </Badge>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="font-medium">
                                  {room.square_footage?.toLocaleString() || 0}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <div className="font-medium">
                                  {room.capacity?.toLocaleString() || 0}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {utilizationRate ? (
                                  <div className="font-medium">
                                    {utilizationRate}%
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <Badge variant="outline">
                                  Active
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAssignStaffToRoom(room)}
                                  >
                                    <UserPlus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRoom(room);
                                      setIsEditRoomModalOpen(true);
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRoom(room)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                  <p className="text-muted-foreground mb-4">
                    This building doesn't have any rooms yet.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsRoomModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Building Systems</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSystemModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add System
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {building.building_systems && building.building_systems.length > 0 ? (
                <>
                  {/* Systems Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Systems</p>
                      <p className="text-2xl font-bold">{building.building_systems.length}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Operational</p>
                      <p className="text-2xl font-bold text-green-400">
                        {building.building_systems.filter((s: any) => s.status === 'operational').length}
                      </p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Needs Maintenance</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {building.building_systems.filter((s: any) => 
                          s.next_maintenance_date && new Date(s.next_maintenance_date) < new Date()
                        ).length}
                      </p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Warranty Expired</p>
                      <p className="text-2xl font-bold text-red-400">
                        {building.building_systems.filter((s: any) => 
                          s.warranty_expiry && new Date(s.warranty_expiry) < new Date()
                        ).length}
                      </p>
                    </div>
                  </div>

                  {/* Systems Table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[1200px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Manufacturer</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Model</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Installation</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Warranty</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Condition</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Maintenance</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Next Service</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contact</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {building.building_systems.map((system: any) => (
                          <tr key={system.id} className="border-b hover:bg-accent/50 transition-colors">
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-primary" />
                                {system.system_type}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-foreground">{system.name}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{system.manufacturer || '-'}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{system.model || '-'}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {system.installation_date ? new Date(system.installation_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {system.warranty_expiry ? (
                                <span className={new Date(system.warranty_expiry) < new Date() ? 'text-red-400' : ''}>
                                  {new Date(system.warranty_expiry).toLocaleDateString()}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  system.condition === 'excellent' ? 'border-green-500 text-green-400' :
                                  system.condition === 'good' ? 'border-blue-500 text-blue-400' :
                                  system.condition === 'fair' ? 'border-yellow-500 text-yellow-400' :
                                  'border-red-500 text-red-400'
                                }`}
                              >
                                {system.condition}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {system.maintenance_schedule?.replace('_', ' ') || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {system.next_maintenance_date ? (
                                <span className={new Date(system.next_maintenance_date) < new Date() ? 'text-red-400 font-medium' : ''}>
                                  {new Date(system.next_maintenance_date).toLocaleDateString()}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {system.maintenance_contact ? (
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {system.maintenance_contact.name || '-'}
                                    {system.maintenance_contact.company && (
                                      <span className="text-muted-foreground text-xs ml-1">
                                        ({system.maintenance_contact.company})
                                      </span>
                                    )}
                                  </div>
                                  {(system.maintenance_contact.email || system.maintenance_contact.phone) && (
                                    <div className="text-xs text-muted-foreground">
                                      {system.maintenance_contact.email && (
                                        <a 
                                          href={`mailto:${system.maintenance_contact.email}`}
                                          className="hover:text-primary transition-colors block"
                                        >
                                          {system.maintenance_contact.email}
                                        </a>
                                      )}
                                      {system.maintenance_contact.phone && (
                                        <a 
                                          href={`tel:${system.maintenance_contact.phone}`}
                                          className="hover:text-primary transition-colors block"
                                        >
                                          {system.maintenance_contact.phone}
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No contact</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Badge 
                                variant={system.status === 'operational' ? 'default' : 'secondary'}
                                className={system.status === 'operational' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}
                              >
                                {system.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSystem(system);
                                    setIsEditSystemModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSystem(system)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Wrench className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No systems tracked</h3>
                  <p className="mt-1 text-sm text-gray-500">Start tracking building systems for maintenance.</p>
                  <Button 
                    onClick={() => setIsSystemModalOpen(true)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First System
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renovations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Renovation History</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRenovationModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Renovation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {building.renovations && building.renovations.length > 0 ? (
                <>
                  {/* Renovations Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                      <p className="text-2xl font-bold">{building.renovations.length}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Completed</p>
                      <p className="text-2xl font-bold text-green-400">
                        {building.renovations.filter((r: any) => r.status === 'completed').length}
                      </p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {building.renovations.filter((r: any) => r.status === 'in_progress').length}
                      </p>
                    </div>
                    <div className="bg-card p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${building.renovations.reduce((sum: number, r: any) => sum + (r.estimated_budget || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Renovations Table */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[1400px]">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Project</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Area (sq ft)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Start Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Completion</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Budget</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actual Cost</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contractor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Funding</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {building.renovations.map((renovation: any) => (
                          <tr key={renovation.id} className="border-b hover:bg-accent/50 transition-colors">
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Hammer className="w-4 h-4 text-primary" />
                                <div>
                                  <div className="font-medium">{renovation.scope_of_work}</div>
                                  {renovation.notes && (
                                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                                      {renovation.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {renovation.square_footage_affected?.toLocaleString() || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {renovation.start_date ? new Date(renovation.start_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {renovation.completion_date ? new Date(renovation.completion_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {renovation.estimated_budget ? `$${renovation.estimated_budget.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {renovation.actual_cost ? (
                                <span className={renovation.actual_cost > renovation.estimated_budget ? 'text-red-400' : 'text-green-400'}>
                                  ${renovation.actual_cost.toLocaleString()}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              <div>
                                <div className="font-medium">{renovation.contractor_name || '-'}</div>
                                {renovation.contractor_contact && (
                                  <div className="text-xs text-muted-foreground">{renovation.contractor_contact}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                {renovation.funding_source?.replace('_', ' ') || 'Unknown'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Badge 
                                variant={
                                  renovation.status === 'completed' ? 'default' :
                                  renovation.status === 'in_progress' ? 'secondary' :
                                  'outline'
                                }
                                className={
                                  renovation.status === 'completed' ? 'bg-green-600 text-white' :
                                  renovation.status === 'in_progress' ? 'bg-blue-600 text-white' :
                                  renovation.status === 'on_hold' ? 'bg-yellow-600 text-white' :
                                  'border-gray-600 text-gray-400'
                                }
                              >
                                {renovation.status?.replace('_', ' ') || 'Planning'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRenovation(renovation);
                                    setIsEditRenovationModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRenovation(renovation)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Hammer className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No renovations recorded</h3>
                  <p className="mt-1 text-sm text-gray-500">Track renovation projects and improvements.</p>
                  <Button 
                    onClick={() => setIsRenovationModalOpen(true)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Renovation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance Requests</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsMaintenanceModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <MaintenanceRequestList
                buildingId={buildingId}
                requests={building.maintenance_requests || []}
                onAddRequest={() => setIsMaintenanceModalOpen(true)}
                onEditRequest={(request: MaintenanceRequest) => {
                  setSelectedRequest(request);
                  setIsEditMaintenanceModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <BuildingPhotos buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsList buildingId={buildingId} />
        </TabsContent>

        <TabsContent value="calendar">
          <BuildingCalendar 
            buildingId={buildingId}
            buildingName={building.name}
            rooms={building.rooms || []}
            maintenanceEvents={building.maintenance_requests || []}
            systems={building.building_systems || []}
          />
        </TabsContent>
      </Tabs>

      <AddRoomModal 
        key={isRoomModalOpen ? 'open' : 'closed'}
        buildingId={buildingId}
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
      />
      
      <EditRoomModal 
        room={selectedRoom}
        isOpen={isEditRoomModalOpen}
        onClose={() => {
          setIsEditRoomModalOpen(false);
          setSelectedRoom(null);
        }}
      />
      
      <AddSystemModal 
        key={isSystemModalOpen ? 'open' : 'closed'}
        buildingId={buildingId}
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
      />
      
      <EditSystemModal 
        system={selectedSystem}
        buildingId={buildingId}
        isOpen={isEditSystemModalOpen}
        onClose={() => {
          setIsEditSystemModalOpen(false);
          setSelectedSystem(null);
        }}
      />
      
      <AddRenovationModal 
        buildingId={buildingId}
        isOpen={isRenovationModalOpen}
        onClose={() => setIsRenovationModalOpen(false)}
      />
      
      <EditRenovationModal 
        renovation={selectedRenovation}
        buildingId={buildingId}
        isOpen={isEditRenovationModalOpen}
        onClose={() => {
          setIsEditRenovationModalOpen(false);
          setSelectedRenovation(null);
        }}
      />
      
      <EditBuildingModal 
        key={isEditBuildingModalOpen ? 'edit-building-modal-open' : 'edit-building-modal-closed'}
        building={building}
        isOpen={isEditBuildingModalOpen}
        onClose={() => {
          console.log('BuildingDetailClient onClose called, setting isEditBuildingModalOpen to false');
          setIsEditBuildingModalOpen(false);
          console.log('BuildingDetailClient onClose completed');
        }}
      />

      {assigningStaffRoom && (
        <AssignStaffToRoomModal 
          isOpen={isRoomStaffAssignModalOpen}
          onClose={() => {
            setIsRoomStaffAssignModalOpen(false);
            setAssigningStaffRoom(null);
          }}
          roomId={assigningStaffRoom.id}
          roomNumber={assigningStaffRoom.room_number}
          buildingName={building?.name || 'Unknown Building'}
          facilityName={facility?.name || 'Unknown Facility'}
          onAssignmentChange={() => {
            console.log('Staff assignment changed for room:', assigningStaffRoom.room_number);
          }}
        />
      )}

      <AddMaintenanceRequestForm
        buildingId={buildingId}
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSubmit={handleMaintenanceSubmit}
        rooms={building.rooms}
        systems={building.building_systems}
      />

      {selectedRequest && (
        <AddMaintenanceRequestForm
          buildingId={buildingId}
          isOpen={isEditMaintenanceModalOpen}
          onClose={() => {
            setIsEditMaintenanceModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={(data) => handleEditMaintenanceRequest(selectedRequest, data)}
          rooms={building.rooms}
          systems={building.building_systems}
          initialData={selectedRequest}
        />
      )}
    </div>
  );
}                