'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFacilityById, deleteFacility } from '@/app/actions/facilities';
import { Facility } from '@/types/facility';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Calendar, Users, Building2, AlertTriangle, Square, Plus, Activity, FileText, Wrench, Home, TrendingUp, Clock, ArrowRight, Grid3X3, List, LayoutGrid, Edit2, Trash2 } from 'lucide-react';
import MaintenanceCalendar from '@/components/facility/MaintenanceCalendar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BuildingService } from '@/lib/services/building.service';
import { Building } from '@/types/building';
import toast from 'react-hot-toast';
import { getDocuments } from '@/app/actions/documents';
import { FacilityDocumentsList } from '@/components/facility/FacilityDocumentsList';
import { MatterportSettings } from '@/components/facility/MatterportSettings';
import UploadAerialImageModal from '@/components/facility/UploadAerialImageModal';
import { getAerialImages } from '@/app/actions/aerialImages';
import { Camera, Map } from 'lucide-react';
import EditFacilityModal from '@/components/facility/EditFacilityModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to validate and convert IDs
const validateUuid = (id: string): string | null => {
  // Check if it's already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // Check if it's a simple ID that maps to our mock data
  if (mockFacilities[id]) {
    console.log(`Using mock ID mapping for simple ID: ${id}`);
    return id;
  }
  
  // For numeric IDs, we could map them to specific UUIDs
  const idMappings: Record<string, string> = {
    '1': '123e4567-e89b-12d3-a456-426614174000',
    '2': '223e4567-e89b-12d3-a456-426614174001',
  };
  
  if (idMappings[id]) {
    console.log(`Mapped simple ID ${id} to UUID ${idMappings[id]}`);
    return idMappings[id];
  }
  
  console.warn(`Invalid ID format: ${id}`);
  return null;
};

// Simple Building type for mock data
interface SimpleBuildingType {
  id: string;
  facility_id: string;
  name: string;
  description: string;
  year_built: number;
  square_footage: number;
  floors: number;
  rooms: number;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

// Mock facility data (replace with Supabase query)
const mockFacilities: Record<string, Facility> = {
  '123e4567-e89b-12d3-a456-426614174000': {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Main Office Building',
    facility_type: 'Office',
    address: '123 Business Ave, New York, NY 10001',
    description: 'A 10-story office building with modern amenities and conference facilities.',
    status: 'active',
    square_footage: 125000,
    facility_condition_index: 92,
    rooms: 24,
    active_issues: 3, 
    occupancy_rate: 98,
    created_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  '223e4567-e89b-12d3-a456-426614174001': {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Warehouse Facility',
    facility_type: 'Warehouse',
    address: '456 Industrial Pkwy, Chicago, IL 60007',
    description: 'Large warehouse with loading docks and storage facilities for inventory management.',
    status: 'active',
    square_footage: 200000,
    facility_condition_index: 85,
    rooms: 5,
    active_issues: 1,
    occupancy_rate: 75,
    created_by: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

// Mock buildings data - also update building IDs and facility_id references
const mockBuildings: SimpleBuildingType[] = [
  {
    id: '323e4567-e89b-12d3-a456-426614174002',
    facility_id: '123e4567-e89b-12d3-a456-426614174000', // Reference to Main Office Building
    name: 'Main Tower',
    year_built: 2005,
    square_footage: 100000,
    floors: 10,
    rooms: 200,
    description: 'Main office tower with conference rooms and executive offices',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '423e4567-e89b-12d3-a456-426614174003',
    facility_id: '123e4567-e89b-12d3-a456-426614174000', // Reference to Main Office Building
    name: 'Annex Building',
    year_built: 2010,
    square_footage: 25000,
    floors: 3,
    rooms: 40,
    description: 'Supplementary office space with meeting rooms and cafeteria',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function FacilityOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params?.facilityId as string;
  const [facility, setFacility] = useState<Facility | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [aerialImages, setAerialImages] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [buildingViewMode, setBuildingViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function loadFacilityAndBuildings() {
      // Prevent multiple fetches
      if (hasFetched || !facilityId) return;
      
      try {
        setIsLoading(true);
        setHasFetched(true);
        
        console.log(`Loading facility ${facilityId}...`);
        const startTime = Date.now();
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
        });
        
        // Fetch facility data directly using server action
        const facilityPromise = getFacilityById(facilityId);
        
        // Race between the actual fetch and timeout
        const facilityData = await Promise.race([facilityPromise, timeoutPromise]) as Facility;
        
        console.log(`Facility loaded in ${Date.now() - startTime}ms`);
        setFacility(facilityData);
        
        // Fetch buildings, documents, and aerial images for this facility in parallel
        const [buildingsData, documentsData, aerialImagesData] = await Promise.all([
          // Buildings
          (async () => {
        try {
          const buildingsStartTime = Date.now();
              const data = await BuildingService.getBuildingsByFacilityId(facilityId);
          console.log(`Buildings loaded in ${Date.now() - buildingsStartTime}ms`);
              return data || [];
            } catch (error) {
              console.error('Error loading buildings:', error);
              return [];
            }
          })(),
          // Documents
          (async () => {
            try {
              const documentsStartTime = Date.now();
              const data = await getDocuments(facilityId, 'facility');
              console.log(`Documents loaded in ${Date.now() - documentsStartTime}ms`);
              return data || [];
            } catch (error) {
              console.error('Error loading documents:', error);
              return [];
            }
          })(),
          // Aerial Images
          (async () => {
            try {
              const aerialStartTime = Date.now();
              const data = await getAerialImages(facilityId);
              console.log(`Aerial images loaded in ${Date.now() - aerialStartTime}ms`);
              return data || [];
            } catch (error) {
              console.error('Error loading aerial images:', error);
              return [];
            }
          })()
        ]);
        
        setBuildings(buildingsData);
        setDocuments(documentsData);
        setAerialImages(aerialImagesData);
      } catch (error) {
        console.error('Error loading facility:', error);
        
        if (error instanceof Error && error.message === 'Request timeout') {
          toast.error('Loading is taking too long. Please refresh the page.');
        } else {
          toast.error('Failed to load facility details');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadFacilityAndBuildings();
  }, [facilityId, hasFetched]);

  const loadDocuments = async () => {
    if (!facilityId) return;
    try {
      const documentsData = await getDocuments(facilityId, 'facility');
      setDocuments(documentsData || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  };

  const loadAerialImages = async () => {
    if (!facilityId) return;
    try {
      const aerialImagesData = await getAerialImages(facilityId);
      setAerialImages(aerialImagesData || []);
    } catch (error) {
      console.error('Error loading aerial images:', error);
      setAerialImages([]);
    }
  };

  const handleUpdateFacility = (updatedFacility: Facility) => {
    setFacility(updatedFacility);
  };

  const handleDeleteFacility = async () => {
    try {
      await deleteFacility(facilityId);
      toast.success('Facility deleted successfully');
      router.push('/facilities');
    } catch (error) {
      console.error('Error deleting facility:', error);
      toast.error('Failed to delete facility');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading facility details...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Facility Not Found</h2>
          <p className="mt-2 text-gray-400">The facility you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/facilities">
            <Button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">Back to Facilities</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getFCIColor = (fci: number) => {
    if (fci >= 90) return 'text-green-600';
    if (fci >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{facility.name}</h1>
              <div className="flex items-center mt-2 text-gray-300">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{facility.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(facility.status)} border`}>
                {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="border-red-700 text-red-500 hover:bg-red-950/50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 bg-gray-800 border border-gray-700 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-lg"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="buildings"
              className="text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-lg"
            >
              Buildings
            </TabsTrigger>
            <TabsTrigger 
              value="maintenance"
              className="text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-lg"
            >
              Maintenance
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-lg"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="virtual-tour"
              className="text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-lg"
            >
              Virtual Tour
            </TabsTrigger>
            <TabsTrigger 
              value="aerial-images"
              className="text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white hover:text-white hover:bg-gray-700 transition-all duration-200 rounded-lg"
            >
              <Map className="w-4 h-4 mr-2" />
              Aerial Images
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics - Dark Theme Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900/50 border-gray-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-400">Facility Type</p>
                  <p className="text-2xl font-semibold text-white mt-2">{facility.facility_type}</p>
                  <p className="text-xs text-gray-500 mt-1">Classification</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 border-gray-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-400">Facility Condition</p>
                  <p className={`text-2xl font-semibold mt-2 ${getFCIColor(facility.facility_condition_index || 0)}`}>
                    {facility.facility_condition_index || 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">FCI Score</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/50 border-gray-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-400">Status</p>
                  <div className="mt-2">
                    <Badge className={`${getStatusColor(facility.status)} border`}>
                      {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Current Status</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Facility Details - Dark Theme Layout */}
            <Card className="bg-gray-900/50 border-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-lg font-semibold text-white">Facility Details</CardTitle>
                <CardDescription className="text-gray-400">
                  General information about this facility
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
                      <p className="text-gray-300 leading-relaxed">{facility.description || 'No description available'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Square Footage</p>
                        <p className="text-xl font-semibold text-white">{facility.square_footage ? facility.square_footage.toLocaleString() : 'N/A'} sq ft</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Rooms</p>
                        <p className="text-xl font-semibold text-white">{facility.rooms || 0}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Occupancy Rate</p>
                        <p className="text-xl font-semibold text-white">{facility.occupancy_rate || 0}%</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Issues</p>
                        <p className="text-xl font-semibold text-white">{facility.active_issues || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Key Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                          <p className="text-3xl font-bold text-white">{facility.rooms || 0}</p>
                          <p className="text-sm text-gray-400 mt-1">Total Rooms</p>
                        </div>
                        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                          <p className="text-3xl font-bold text-white">{facility.active_issues || 0}</p>
                          <p className="text-sm text-gray-400 mt-1">Active Issues</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-400">Last Updated</span>
                          <span className="text-sm font-medium text-white">
                            {new Date(facility.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-gray-800">
                          <span className="text-sm text-gray-400">Created</span>
                          <span className="text-sm font-medium text-white">
                            {new Date(facility.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="buildings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-white">Buildings</h2>
                <p className="text-gray-400 mt-1">Manage all buildings in this facility</p>
              </div>
              <div className="flex items-center gap-4">
                {/* View Mode Switcher */}
                <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuildingViewMode('grid')}
                    className={`h-8 w-8 p-1 rounded-md transition-all border-0 ${
                      buildingViewMode === 'grid'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuildingViewMode('table')}
                    className={`h-8 w-8 p-1 rounded-md transition-all border-0 ${
                      buildingViewMode === 'table'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
              <Link href={`/facility/${facilityId}/buildings/new`}>
                <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Building
                </Button>
              </Link>
              </div>
            </div>
            
            {buildings.length > 0 ? (
              buildingViewMode === 'grid' ? (
                /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildings.map((building) => (
                  <Link 
                    key={building.id}
                    href={`/facility/${facilityId}/buildings/${building.id}`}
                    className="group"
                  >
                    <Card className="bg-gray-900/50 border-gray-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold text-lg text-white group-hover:text-purple-300">
                            {building.name}
                          </h3>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {building.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-400">
                          <p>Type: {building.building_type}</p>
                          <p>{building.square_footage.toLocaleString()} sq ft</p>
                          <p>{building.number_of_rooms} rooms</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <div className="flex items-center text-white text-sm font-medium group-hover:text-purple-300">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              ) : (
                /* Table View */
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-gray-800/50">
                          <TableHead className="text-gray-300 font-semibold">Building Name</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Type</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Square Footage</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Rooms</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-300 font-semibold">Year Built</TableHead>
                          <TableHead className="text-gray-300 font-semibold w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buildings.map((building) => (
                          <TableRow 
                            key={building.id} 
                            className="border-gray-800 hover:bg-gray-800/30 cursor-pointer group"
                            onClick={() => window.location.href = `/facility/${facilityId}/buildings/${building.id}`}
                          >
                            <TableCell className="font-medium text-white group-hover:text-purple-300">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                                {building.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400">{building.building_type}</TableCell>
                            <TableCell className="text-gray-400">{building.square_footage.toLocaleString()} sq ft</TableCell>
                            <TableCell className="text-gray-400">{building.number_of_rooms}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {building.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {building.construction_date ? new Date(building.construction_date).getFullYear() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Link href={`/facility/${facilityId}/buildings/${building.id}`}>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-purple-300 hover:bg-gray-800 border-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="py-16 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-4 text-lg font-medium text-white">No buildings yet</h3>
                  <p className="mt-2 text-gray-400">Get started by adding your first building.</p>
                  <div className="mt-6">
                    <Link href={`/facility/${facilityId}/buildings/new`}>
                      <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Building
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="maintenance">
            <MaintenanceCalendar facilityId={facilityId} />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Documents</h2>
              <p className="text-gray-400 mt-1">Manage facility documentation and files</p>
            </div>
            
            <FacilityDocumentsList
              facilityId={facilityId}
              documents={documents}
              onDocumentsChange={loadDocuments}
            />
          </TabsContent>
          
          <TabsContent value="virtual-tour">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-lg font-semibold text-white">Virtual Tour</CardTitle>
                <CardDescription className="text-gray-400">
                  Experience this facility in 360° virtual reality
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {facility.matterport_url ? (
                  <div className="space-y-4">
                    <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-gray-800">
                      <iframe
                        src={facility.matterport_url}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="vr"
                        allowFullScreen
                        className="w-full h-full"
                        title={`Virtual Tour of ${facility.name}`}
                      />
                    </div>
                <div className="text-center">
                      <p className="text-sm text-gray-400">
                        Use your mouse or touch to navigate through the 3D space
                      </p>
                    </div>
                    <MatterportSettings
                      facilityId={facility.id}
                      currentUrl={facility.matterport_url}
                      onUpdate={() => {
                        // Reload facility data
                        setHasFetched(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Camera className="mx-auto h-12 w-12 text-gray-600" />
                    <h3 className="mt-4 text-lg font-medium text-white">No Virtual Tour Available</h3>
                    <p className="text-gray-400 mt-2">
                      Add a Matterport virtual tour to showcase this facility in 3D
                    </p>
                    <MatterportSettings
                      facilityId={facility.id}
                      currentUrl=""
                      onUpdate={() => {
                        // Reload facility data
                        setHasFetched(false);
                      }}
                    />
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="aerial-images">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Maps & Aerial Images</h2>
                  <p className="text-gray-400 mt-1">Drone photos, mosaics, and aerial mapping data</p>
                </div>
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              {aerialImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aerialImages.map((image: any) => (
                    <Card key={image.id} className="bg-gray-900/50 border-gray-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-800 mb-4">
                          {image.image_url ? (
                            <img
                              src={image.image_url}
                              alt={image.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="h-8 w-8 text-gray-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-white text-sm">{image.title}</h3>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {image.image_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {image.description && (
                            <p className="text-xs text-gray-400 line-clamp-2">{image.description}</p>
                          )}
                          
                          <div className="space-y-1 text-xs text-gray-500">
                            {image.capture_date && (
                              <p>Captured: {new Date(image.capture_date).toLocaleDateString()}</p>
                            )}
                            {image.altitude && <p>Altitude: {image.altitude} ft</p>}
                            {image.resolution && <p>Resolution: {image.resolution}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="py-16 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-600" />
                    <h3 className="mt-4 text-lg font-medium text-white">No aerial images yet</h3>
                    <p className="mt-2 text-gray-400">Upload drone photos, mosaics, and aerial maps to get started.</p>
                    <Button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload First Image
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Aerial Image Modal */}
      <UploadAerialImageModal
        facilityId={facilityId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={loadAerialImages}
      />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EditFacilityModal
          facility={facility}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateFacility}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 text-white border border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-white">Delete Facility</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this facility? This action cannot be undone.
              All associated buildings, rooms, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFacility}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Facility
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 