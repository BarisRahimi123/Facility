'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight, Home, Building2, Plus, Wrench, Hammer, Edit2, Trash2 } from 'lucide-react';
import AddRoomModal from '@/components/building/AddRoomModal';
import EditRoomModal from '@/components/building/EditRoomModal';
import AddSystemModal from '@/components/building/AddSystemModal';
import EditSystemModal from '@/components/building/EditSystemModal';
import AddRenovationModal from '@/components/building/AddRenovationModal';
import EditRenovationModal from '@/components/building/EditRenovationModal';
import EditBuildingModal from '@/components/building/EditBuildingModal';
import DocumentsList from '@/components/documents/DocumentsList';
import { deleteRoom, deleteBuildingSystem, deleteRenovation } from '@/app/actions/buildings';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface BuildingDetailClientProps {
  building: any;
  facility: any;
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
    const isConfirmed = window.confirm(
      `Are you sure you want to delete renovation "${renovation.scope_of_work}"? This action cannot be undone.`
    );

    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await deleteRenovation(renovation.id);
      toast({
        title: 'Renovation deleted',
        description: `Renovation has been deleted successfully.`,
        variant: 'success',
      });
      router.refresh();
    } catch (error) {
      console.error('Error deleting renovation:', error);
      toast({
        title: 'Failed to delete renovation',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/facilities" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors">
              <Home className="w-4 h-4 mr-2" />
              Facilities
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <Link 
                href={`/facility/${facilityId}`}
                className="ml-1 text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors md:ml-2"
              >
                {facility?.name || 'Facility'}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="ml-1 text-sm font-medium text-gray-300 md:ml-2">
                {building.name}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{building.name}</h1>
            <div className="flex items-center mt-2 space-x-2">
              <Badge 
                variant={building.status === 'active' ? 'default' : 'secondary'}
                className={building.status === 'active' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}
              >
                {building.status}
              </Badge>
              {building.building_number && (
                <span className="text-sm text-gray-400">Building #{building.building_number}</span>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={() => setIsEditBuildingModalOpen(true)}
          >
            Edit Building
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="rooms" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Rooms</TabsTrigger>
          <TabsTrigger value="systems" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Systems</TabsTrigger>
          <TabsTrigger value="renovations" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Renovations</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Building Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white capitalize">{building.building_type?.replace('_', ' ') || 'N/A'}</div>
                <p className="text-xs text-gray-500 mt-1">Classification</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Square Footage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{building.square_footage?.toLocaleString() || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Total Area</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Building Age</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(() => {
                    if (!building.construction_date && !building.year_built) return 'Unknown';
                    
                    const currentYear = new Date().getFullYear();
                    let buildingYear = null;
                    
                    // Prioritize year_built since it's more reliable
                    if (building.year_built) {
                      buildingYear = parseInt(building.year_built.toString());
                    } else if (building.construction_date) {
                      // Extract year from construction_date
                      const constructionDate = new Date(building.construction_date);
                      if (!isNaN(constructionDate.getTime())) {
                        buildingYear = constructionDate.getFullYear();
                      }
                    }
                    
                    // Validate building year
                    if (!buildingYear || buildingYear > currentYear || buildingYear < 1800) {
                      return 'Unknown';
                    }
                    
                    // Simple calculation: Current Year - Building Year = Age
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
                <p className="text-xs text-gray-500 mt-1">
                  {building.construction_date ? 
                    `Built ${new Date(building.construction_date).toLocaleDateString()}` :
                    building.year_built ? 
                      `Built in ${building.year_built}` :
                      'Construction date unknown'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{building.rooms?.length || building.number_of_rooms || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Total Rooms</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Building Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Building Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{building.building_systems?.length || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {building.building_systems?.filter((s: any) => s.status === 'operational').length || 0} Operational
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Renovations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{building.renovations?.length || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {building.renovations?.filter((r: any) => r.status === 'completed').length || 0} Completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Total Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {building.rooms?.reduce((sum: number, room: any) => sum + (room.capacity || 0), 0)?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">People</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-300">Space Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {(() => {
                    const totalCapacity = building.rooms?.reduce((sum: number, room: any) => sum + (room.capacity || 0), 0) || 0;
                    const totalArea = building.square_footage || 0;
                    if (totalArea === 0) return 'N/A';
                    const efficiency = (totalCapacity / totalArea * 100).toFixed(1);
                    return `${efficiency}%`;
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">People per 100 sq ft</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Building Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Construction Date</h3>
                  <p className="mt-1 text-white">{building.construction_date ? new Date(building.construction_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Year Built</h3>
                  <p className="mt-1 text-white">{building.year_built || 'N/A'}</p>
                </div>
              </div>
              {building.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Notes</h3>
                  <p className="mt-1 text-sm text-gray-300">{building.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Rooms</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRoomModalOpen(true)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white gap-2"
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
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Total Rooms</p>
                      <p className="text-2xl font-bold text-white">{building.rooms.length}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Total Area</p>
                      <p className="text-2xl font-bold text-white">
                        {building.rooms.reduce((sum: number, r: any) => sum + (r.square_footage || 0), 0).toLocaleString()}
                        <span className="text-sm text-gray-400 ml-1">sq ft</span>
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Total Capacity</p>
                      <p className="text-2xl font-bold text-white">
                        {building.rooms.reduce((sum: number, r: any) => sum + (r.capacity || 0), 0).toLocaleString()}
                        <span className="text-sm text-gray-400 ml-1">people</span>
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Room Types</p>
                      <p className="text-2xl font-bold text-white">
                        {new Set(building.rooms.map((r: any) => r.room_function).filter(Boolean)).size}
                      </p>
                    </div>
                  </div>

                  {/* Rooms Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Room Number</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Function</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Floor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Area (sq ft)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Capacity</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Utilization</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {building.rooms.map((room: any) => {
                          const utilizationRate = room.capacity && room.square_footage ? 
                            (room.capacity / room.square_footage * 100).toFixed(1) : null;
                          
                          return (
                            <tr key={room.id} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-purple-400" />
                                  <div>
                                    <div className="font-medium text-white">Room {room.room_number}</div>
                                    {room.name && room.name !== room.room_number && (
                                      <div className="text-xs text-gray-500">{room.name}</div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    room.room_function === 'Classroom' ? 'border-blue-500 text-blue-400' :
                                    room.room_function === 'Office' ? 'border-green-500 text-green-400' :
                                    room.room_function === 'Laboratory' ? 'border-purple-500 text-purple-400' :
                                    room.room_function === 'Conference' ? 'border-yellow-500 text-yellow-400' :
                                    'border-gray-600 text-gray-400'
                                  }`}
                                >
                                  {room.room_function || 'General'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                {room.floor ? (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            Floor {room.floor}
                          </Badge>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                <div className="font-medium">
                                  {room.square_footage?.toLocaleString() || 0}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                {room.capacity ? (
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{room.capacity}</span>
                                    <span className="text-xs text-gray-500">people</span>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                {utilizationRate ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          parseFloat(utilizationRate) > 15 ? 'bg-red-500' :
                                          parseFloat(utilizationRate) > 10 ? 'bg-yellow-500' :
                                          'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(parseFloat(utilizationRate) * 10, 100)}%` }}
                                      ></div>
                      </div>
                                    <span className="text-xs text-gray-500 w-10">
                                      {utilizationRate}%
                                    </span>
                      </div>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <Badge 
                                  variant="default"
                                  className="bg-green-600 text-white"
                                >
                                  {room.status || 'Active'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800"
                                    onClick={() => {
                                      setSelectedRoom(room);
                                      setIsEditRoomModalOpen(true);
                                    }}
                                    disabled={isDeleting}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-600 text-red-400 hover:text-white hover:bg-red-600"
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
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-300">No rooms</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a room to this building.</p>
                  <Button 
                    onClick={() => setIsRoomModalOpen(true)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Room
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="systems">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Building Systems</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsSystemModalOpen(true)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white gap-2"
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
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Total Systems</p>
                      <p className="text-2xl font-bold text-white">{building.building_systems.length}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Operational</p>
                      <p className="text-2xl font-bold text-green-400">
                        {building.building_systems.filter((s: any) => s.status === 'operational').length}
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Needs Maintenance</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {building.building_systems.filter((s: any) => 
                          s.next_maintenance_date && new Date(s.next_maintenance_date) < new Date()
                        ).length}
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Warranty Expired</p>
                      <p className="text-2xl font-bold text-red-400">
                        {building.building_systems.filter((s: any) => 
                          s.warranty_expiry && new Date(s.warranty_expiry) < new Date()
                        ).length}
                      </p>
                    </div>
                  </div>

                  {/* Systems Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <table className="w-full min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Manufacturer</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Model</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Installation</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Warranty</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Condition</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Maintenance</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Next Service</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                  {building.building_systems.map((system: any) => (
                        <tr key={system.id} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-purple-400" />
                              {system.system_type}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-white">{system.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-300">{system.manufacturer || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-300">{system.model || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {system.installation_date ? new Date(system.installation_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
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
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {system.maintenance_schedule?.replace('_', ' ') || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {system.next_maintenance_date ? (
                              <span className={new Date(system.next_maintenance_date) < new Date() ? 'text-red-400 font-medium' : ''}>
                                {new Date(system.next_maintenance_date).toLocaleDateString()}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-300">
                            {system.maintenance_contact ? (
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {system.maintenance_contact.name || '-'}
                                  {system.maintenance_contact.company && (
                                    <span className="text-gray-400 text-xs ml-1">
                                      ({system.maintenance_contact.company})
                                    </span>
                                  )}
                          </div>
                                {(system.maintenance_contact.email || system.maintenance_contact.phone) && (
                                  <div className="text-xs text-gray-400">
                                    {system.maintenance_contact.email && (
                                      <a 
                                        href={`mailto:${system.maintenance_contact.email}`}
                                        className="hover:text-purple-400 transition-colors block"
                                      >
                                        {system.maintenance_contact.email}
                                      </a>
                                    )}
                                    {system.maintenance_contact.phone && (
                                      <a 
                                        href={`tel:${system.maintenance_contact.phone}`}
                                        className="hover:text-purple-400 transition-colors block"
                                      >
                                        {system.maintenance_contact.phone}
                                      </a>
                                    )}
                          </div>
                                )}
                        </div>
                            ) : (
                              <span className="text-gray-500">No contact</span>
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
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800"
                                onClick={() => {
                                  setSelectedSystem(system);
                                  setIsEditSystemModalOpen(true);
                                }}
                                disabled={isDeleting}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-400 hover:text-white hover:bg-red-600"
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Renovation History</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsRenovationModalOpen(true)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white gap-2"
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
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Total Projects</p>
                      <p className="text-2xl font-bold text-white">{building.renovations.length}</p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Completed</p>
                      <p className="text-2xl font-bold text-green-400">
                        {building.renovations.filter((r: any) => r.status === 'completed').length}
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {building.renovations.filter((r: any) => r.status === 'in_progress').length}
                      </p>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Total Budget</p>
                      <p className="text-2xl font-bold text-white">
                        ${building.renovations.reduce((sum: number, r: any) => sum + (r.estimated_budget || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Renovations Table */}
                  <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full min-w-[1400px]">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Project</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Area (sq ft)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Start Date</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Completion</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Budget</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actual Cost</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Contractor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Funding</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                  {building.renovations.map((renovation: any) => (
                          <tr key={renovation.id} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-300">
                              <div className="flex items-center gap-2">
                                <Hammer className="w-4 h-4 text-purple-400" />
                                <div>
                                  <div className="font-medium text-white">{renovation.scope_of_work}</div>
                                  {renovation.notes && (
                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                      {renovation.notes}
                          </div>
                            )}
                          </div>
                        </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {renovation.square_footage_affected?.toLocaleString() || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {renovation.start_date ? new Date(renovation.start_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {renovation.completion_date ? new Date(renovation.completion_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {renovation.estimated_budget ? `$${renovation.estimated_budget.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              {renovation.actual_cost ? (
                                <span className={renovation.actual_cost > renovation.estimated_budget ? 'text-red-400' : 'text-green-400'}>
                                  ${renovation.actual_cost.toLocaleString()}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
                              <div>
                                <div className="font-medium">{renovation.contractor_name || '-'}</div>
                                {renovation.contractor_contact && (
                                  <div className="text-xs text-gray-500">{renovation.contractor_contact}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-300">
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
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800"
                                  onClick={() => {
                                    setSelectedRenovation(renovation);
                                    setIsEditRenovationModalOpen(true);
                                  }}
                                  disabled={isDeleting}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-600 text-red-400 hover:text-white hover:bg-red-600"
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

        <TabsContent value="documents">
          <DocumentsList buildingId={buildingId} />
        </TabsContent>
      </Tabs>

      <AddRoomModal 
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
        building={building}
        isOpen={isEditBuildingModalOpen}
        onClose={() => setIsEditBuildingModalOpen(false)}
      />
    </div>
  );
} 