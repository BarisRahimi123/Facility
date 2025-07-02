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
import { MapPin, Calendar, Users, Building2, AlertTriangle, Square, Plus, Activity, FileText, Wrench, Home, TrendingUp, Clock, ArrowRight, Grid3X3, List, LayoutGrid, Edit2, Trash2, Share2, Shield, Route, Phone, Package, Heart, MapIcon, Upload, Settings, Check, ChevronDown, Camera, Map as MapIcon2 } from 'lucide-react';
import MaintenanceCalendar from '@/components/facility/MaintenanceCalendar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BuildingService } from '@/lib/services/building.service';
import { Building } from '@/types/building';
import toast from 'react-hot-toast';
import { getDocuments } from '@/app/actions/documents';
import { FacilityDocumentsList } from '@/components/facility/FacilityDocumentsList';
import { FacilityPhotos } from '@/components/facility/FacilityPhotos';
import { MatterportSettings } from '@/components/facility/MatterportSettings';
import { MasterCalendar } from '@/components/calendar/MasterCalendar';
import UploadAerialImageModal from '@/components/facility/UploadAerialImageModal';
import { getAerialImages } from '@/app/actions/aerialImages';
import EditFacilityModal from '@/components/facility/EditFacilityModal';
import ShareFacilityModal from '@/components/facilities/ShareFacilityModal';
import { createFacilityInvitation, ShareRequest } from '@/app/actions/facilitySharing';
import UploadEmergencyDocumentModal from '@/components/facility/UploadEmergencyDocumentModal';
import EmergencyDocumentsView from '@/components/facility/EmergencyDocumentsView';
import { FacilityFields } from '@/components/facility/FacilityFields';
import { getEmergencyDocumentCounts } from '@/app/actions/emergencyDocuments';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [emergencyDocumentCounts, setEmergencyDocumentCounts] = useState<Record<string, number>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [buildingViewMode, setBuildingViewMode] = useState<'grid' | 'table'>('grid');
  
  // Column visibility state for buildings table
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    type: true,
    squareFootage: true,
    rooms: true,
    status: true,
    yearBuilt: true,
    actions: true
  });

  // Load column preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('buildingTableColumns');
    if (savedPreferences) {
      try {
        setVisibleColumns(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading column preferences:', error);
      }
    }
  }, []);

  // Save column preferences to localStorage
  const updateColumnVisibility = (column: string, visible: boolean) => {
    const updatedColumns = { ...visibleColumns, [column]: visible };
    setVisibleColumns(updatedColumns);
    localStorage.setItem('buildingTableColumns', JSON.stringify(updatedColumns));
  };
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEmergencyUploadModalOpen, setIsEmergencyUploadModalOpen] = useState(false);
  const [selectedEmergencyCategory, setSelectedEmergencyCategory] = useState<{
    category: 'emergency_plan' | 'evacuation_routes' | 'emergency_contacts' | 'equipment' | 'life_safety' | 'floor_plans';
    name: string;
  } | null>(null);
  const [isEmergencyDocumentsViewOpen, setIsEmergencyDocumentsViewOpen] = useState(false);

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
        
        // Fetch buildings, documents, aerial images, and emergency document counts for this facility in parallel
        const [buildingsData, documentsData, aerialImagesData, emergencyCountsData] = await Promise.all([
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
          })(),
          // Emergency Document Counts
          (async () => {
            try {
              const countsStartTime = Date.now();
              const data = await getEmergencyDocumentCounts(facilityId);
              console.log(`Emergency document counts loaded in ${Date.now() - countsStartTime}ms`);
              return data || {};
            } catch (error) {
              console.error('Error loading emergency document counts:', error);
              return {};
            }
          })()
        ]);
        
        setBuildings(buildingsData);
        setDocuments(documentsData);
        setAerialImages(aerialImagesData);
        setEmergencyDocumentCounts(emergencyCountsData);
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

  const loadBuildings = async () => {
    if (!facilityId) {
      console.error('loadBuildings: No facilityId available');
      return;
    }
    try {
      console.log(`🔍 loadBuildings: Refreshing buildings for facility ${facilityId}...`);
      console.log(`🔍 loadBuildings: facilityId type: ${typeof facilityId}, value: "${facilityId}"`);
      
      const buildingsData = await BuildingService.getBuildingsByFacilityId(facilityId);
      
      console.log(`🔍 loadBuildings: Raw response from BuildingService:`, buildingsData);
      console.log(`🔍 loadBuildings: Response type: ${typeof buildingsData}, isArray: ${Array.isArray(buildingsData)}`);
      
      setBuildings(buildingsData || []);
      console.log(`✅ loadBuildings: Loaded ${buildingsData?.length || 0} buildings`);
      
      if (buildingsData && buildingsData.length > 0) {
        console.log(`🏗️ loadBuildings: Buildings found:`, buildingsData.map(b => ({ id: b.id, name: b.name, facility_id: b.facility_id })));
      } else {
        console.warn(`⚠️ loadBuildings: No buildings found for facility ${facilityId}`);
      }
    } catch (error) {
      console.error('❌ loadBuildings: Error loading buildings:', error);
      console.error('❌ loadBuildings: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        facilityId: facilityId
      });
      setBuildings([]);
    }
  };

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

  const handleShare = async (shareRequest: ShareRequest) => {
    try {
      const result = await createFacilityInvitation(shareRequest);
      
      if (result.success) {
        toast.success('Invitation sent successfully!');
      } else {
        toast.error(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sharing facility:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleEmergencyUpload = (category: 'emergency_plan' | 'evacuation_routes' | 'emergency_contacts' | 'equipment' | 'life_safety' | 'floor_plans', name: string) => {
    setSelectedEmergencyCategory({ category, name });
    setIsEmergencyUploadModalOpen(true);
  };

  const handleEmergencyFolderOpen = (category: 'emergency_plan' | 'evacuation_routes' | 'emergency_contacts' | 'equipment' | 'life_safety' | 'floor_plans', name: string) => {
    setSelectedEmergencyCategory({ category, name });
    setIsEmergencyDocumentsViewOpen(true);
  };

  const handleEmergencyUploadSuccess = async () => {
    // Reload emergency document counts
    try {
      const counts = await getEmergencyDocumentCounts(facilityId);
      setEmergencyDocumentCounts(counts);
    } catch (error) {
      console.error('Error reloading emergency document counts:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading facility details...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Facility Not Found</h2>
          <p className="mt-2 text-muted-foreground">The facility you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/facilities">
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">Back to Facilities</Button>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
              <div className="bg-header/95 border-b border-border">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-header-foreground">{facility.name}</h1>
                <div className="flex items-center mt-2 text-muted-foreground">
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
                onClick={() => setIsShareModalOpen(true)}
                className="border-blue-700 text-blue-400 hover:bg-blue-950/50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="border-border text-muted-foreground hover:bg-accent"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="border-destructive text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 bg-background min-h-screen">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-8 bg-muted border border-border p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="buildings"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              Buildings
            </TabsTrigger>
            <TabsTrigger 
              value="fields"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Fields
            </TabsTrigger>
            <TabsTrigger 
              value="photos"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              <Camera className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="maintenance"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              Maintenance
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="virtual-tour"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              Virtual Tour
            </TabsTrigger>
            <TabsTrigger 
              value="aerial-images"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              <MapIcon2 className="w-4 h-4 mr-2" />
              Aerial Images
            </TabsTrigger>
            <TabsTrigger 
              value="emergency"
              className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            >
              <Shield className="w-4 h-4 mr-2" />
              Emergency Information
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics - Theme-aware Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Facility Type</p>
                  <p className="text-2xl font-semibold text-foreground mt-2">{facility.facility_type}</p>
                  <p className="text-xs text-muted-foreground mt-1">Classification</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Facility Condition</p>
                  <p className={`text-2xl font-semibold mt-2 ${getFCIColor(facility.facility_condition_index || 0)}`}>
                    {facility.facility_condition_index || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">FCI Score</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-2">
                    <Badge className={`${getStatusColor(facility.status)} border`}>
                      {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Current Status</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Facility Details - Theme-aware Layout */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold text-card-foreground">Facility Details</CardTitle>
                <CardDescription className="text-muted-foreground">
                  General information about this facility
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Description</h3>
                      <p className="text-foreground leading-relaxed">{facility.description || 'No description available'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Acres</p>
                        <p className="text-xl font-semibold text-foreground">{facility.square_footage ? facility.square_footage.toLocaleString() : 'N/A'}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Rooms</p>
                        <p className="text-xl font-semibold text-foreground">{facility.rooms || 0}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Occupancy Rate</p>
                        <p className="text-xl font-semibold text-foreground">{facility.occupancy_rate || 0}%</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Issues</p>
                        <p className="text-xl font-semibold text-foreground">{facility.active_issues || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Key Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-6 rounded-lg border border-border">
                          <p className="text-3xl font-bold text-foreground">{facility.rooms || 0}</p>
                          <p className="text-sm text-muted-foreground mt-1">Total Rooms</p>
                        </div>
                        <div className="bg-muted/50 p-6 rounded-lg border border-border">
                          <p className="text-3xl font-bold text-foreground">{facility.active_issues || 0}</p>
                          <p className="text-sm text-muted-foreground mt-1">Active Issues</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Last Updated</span>
                          <span className="text-sm font-medium text-foreground">
                            {new Date(facility.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-border">
                          <span className="text-sm text-muted-foreground">Created</span>
                          <span className="text-sm font-medium text-foreground">
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
                <h2 className="text-2xl font-semibold text-foreground">Buildings</h2>
                <p className="text-muted-foreground mt-1">Manage all buildings in this facility</p>
              </div>
              <div className="flex items-center gap-4">
                {/* View Mode Switcher */}
                <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBuildingViewMode('grid')}
                    className={`h-8 w-8 p-1 rounded-md transition-all border-0 ${
                      buildingViewMode === 'grid'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Column Selector - Only show in table mode */}
                {buildingViewMode === 'table' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-muted border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Columns
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-popover border-border w-56">
                      <div className="p-2">
                        <div className="text-sm font-medium text-popover-foreground mb-2">Show Columns</div>
                        <DropdownMenuSeparator className="bg-border" />
                        {[
                          { key: 'name', label: 'Building Name' },
                          { key: 'type', label: 'Type' },
                          { key: 'squareFootage', label: 'Square Footage' },
                          { key: 'rooms', label: 'Rooms' },
                          { key: 'status', label: 'Status' },
                          { key: 'yearBuilt', label: 'Year Built' },
                          { key: 'actions', label: 'Actions' },
                        ].map((column) => (
                          <DropdownMenuItem
                            key={column.key}
                            className="flex items-center justify-between cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            onClick={() => updateColumnVisibility(column.key, !visibleColumns[column.key as keyof typeof visibleColumns])}
                          >
                            <span>{column.label}</span>
                            {visibleColumns[column.key as keyof typeof visibleColumns] && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
              <Button
                onClick={loadBuildings}
                variant="outline"
                className="bg-muted border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-xl px-4 py-3"
              >
                <Activity className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Link href={`/facility/${facilityId}/buildings/new`}>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 rounded-xl px-6 py-3">
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
                    <Card className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:border-primary">
                      <CardContent className="p-6">
                        {/* Building Image */}
                        {building.image_url && (
                          <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-muted mb-4">
                            <img
                              src={building.image_url}
                              alt={building.image_description || building.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-semibold text-lg text-card-foreground group-hover:text-primary">
                            {building.name}
                          </h3>
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {building.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Type: {building.building_type}</p>
                          <p>{building.square_footage.toLocaleString()} sq ft</p>
                          <p>{building.number_of_rooms} rooms</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center text-card-foreground text-sm font-medium group-hover:text-primary">
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
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-muted/50">
                          {visibleColumns.name && <TableHead className="text-muted-foreground font-semibold">Building Name</TableHead>}
                          {visibleColumns.type && <TableHead className="text-muted-foreground font-semibold">Type</TableHead>}
                          {visibleColumns.squareFootage && <TableHead className="text-muted-foreground font-semibold">Square Footage</TableHead>}
                          {visibleColumns.rooms && <TableHead className="text-muted-foreground font-semibold">Rooms</TableHead>}
                          {visibleColumns.status && <TableHead className="text-muted-foreground font-semibold">Status</TableHead>}
                          {visibleColumns.yearBuilt && <TableHead className="text-muted-foreground font-semibold">Year Built</TableHead>}
                          {visibleColumns.actions && <TableHead className="text-muted-foreground font-semibold w-20">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {buildings.map((building) => (
                          <TableRow 
                            key={building.id} 
                            className="border-border hover:bg-muted/30 cursor-pointer group"
                            onClick={() => window.location.href = `/facility/${facilityId}/buildings/${building.id}`}
                          >
                            {visibleColumns.name && (
                              <TableCell className="font-medium text-foreground group-hover:text-primary">
                                <div className="flex items-center">
                                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                                  {building.name}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.type && (
                              <TableCell className="text-muted-foreground">{building.building_type}</TableCell>
                            )}
                            {visibleColumns.squareFootage && (
                              <TableCell className="text-muted-foreground">{building.square_footage.toLocaleString()} sq ft</TableCell>
                            )}
                            {visibleColumns.rooms && (
                              <TableCell className="text-muted-foreground">{building.number_of_rooms}</TableCell>
                            )}
                            {visibleColumns.status && (
                              <TableCell>
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                  {building.status}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.yearBuilt && (
                              <TableCell className="text-muted-foreground">
                                {building.construction_date ? new Date(building.construction_date).getFullYear() : 'N/A'}
                              </TableCell>
                            )}
                            {visibleColumns.actions && (
                              <TableCell>
                                <Link href={`/facility/${facilityId}/buildings/${building.id}`}>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-accent border-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="py-16 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium text-card-foreground">No buildings yet</h3>
                  <p className="mt-2 text-muted-foreground">Get started by adding your first building.</p>
                  <div className="mt-6">
                    <Link href={`/facility/${facilityId}/buildings/new`}>
                      <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 rounded-xl px-6 py-3">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Building
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="fields" className="space-y-6">
            <FacilityFields facilityId={facilityId} />
          </TabsContent>
          
          <TabsContent value="photos" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Facility Photos</h2>
              <p className="text-muted-foreground mt-1">Manage facility photos and showcase your property</p>
            </div>
            
            <FacilityPhotos facilityId={facilityId} />
          </TabsContent>
          
          <TabsContent value="calendar" className="space-y-6">
            <MasterCalendar 
              facilityId={facilityId}
              facilityName={facility.name}
              buildings={buildings}
              fields={[]} // Will be populated when we fetch fields
              reservations={[]} // Will be populated when we fetch reservations
              blackoutDates={[]} // Will be populated when we fetch blackout dates
              maintenanceEvents={[]} // Will be populated when we fetch maintenance events
            />
          </TabsContent>
          
          <TabsContent value="maintenance">
            <MaintenanceCalendar facilityId={facilityId} />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Documents</h2>
              <p className="text-muted-foreground mt-1">Manage facility documentation and files</p>
            </div>
            
            <FacilityDocumentsList
              facilityId={facilityId}
              documents={documents}
              onDocumentsChange={loadDocuments}
            />
          </TabsContent>
          
          <TabsContent value="virtual-tour">
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg font-semibold text-card-foreground">Virtual Tour</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Experience this facility in 360° virtual reality
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {facility.matterport_url ? (
                  <div className="space-y-4">
                    <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-muted">
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
                      <p className="text-sm text-muted-foreground">
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
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-card-foreground">No Virtual Tour Available</h3>
                    <p className="text-muted-foreground mt-2">
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
                  <h2 className="text-2xl font-semibold text-foreground">Maps & Aerial Images</h2>
                  <p className="text-muted-foreground mt-1">Drone photos, mosaics, and aerial mapping data</p>
                </div>
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 rounded-xl px-6 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              {aerialImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aerialImages.map((image: any) => (
                    <Card key={image.id} className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted mb-4">
                          {image.image_url ? (
                            <img
                              src={image.image_url}
                              alt={image.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-card-foreground text-sm">{image.title}</h3>
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                              {image.image_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {image.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{image.description}</p>
                          )}
                          
                          <div className="space-y-1 text-xs text-muted-foreground">
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
                <Card className="bg-card border-border">
                  <CardContent className="py-16 text-center">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-card-foreground">No aerial images yet</h3>
                    <p className="mt-2 text-muted-foreground">Upload drone photos, mosaics, and aerial maps to get started.</p>
                    <Button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 rounded-xl px-6 py-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload First Image
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="emergency">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">Emergency Information</h2>
                  <p className="text-muted-foreground mt-1">Manage emergency plans, contacts, and safety documentation</p>
                </div>
              </div>

              {/* Emergency Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Emergency Plan */}
                <Card 
                  className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEmergencyFolderOpen('emergency_plan', 'Emergency Plan')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-4 bg-red-600/20 rounded-full group-hover:bg-red-600/30 transition-colors">
                        <Shield className="h-8 w-8 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-red-300 transition-colors">Emergency Plan</h3>
                        <p className="text-sm text-muted-foreground mt-1">Comprehensive emergency response procedures</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {emergencyDocumentCounts.emergency_plan || 0} documents
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmergencyUpload('emergency_plan', 'Emergency Plan');
                        }}
                        className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-300 hover:text-red-200 transition-all duration-200"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Evacuation Routes */}
                <Card 
                  className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEmergencyFolderOpen('evacuation_routes', 'Evacuation Routes')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-4 bg-orange-600/20 rounded-full group-hover:bg-orange-600/30 transition-colors">
                        <Route className="h-8 w-8 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-orange-300 transition-colors">Evacuation Routes</h3>
                        <p className="text-sm text-muted-foreground mt-1">Exit paths and assembly points</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {emergencyDocumentCounts.evacuation_routes || 0} documents
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmergencyUpload('evacuation_routes', 'Evacuation Routes');
                        }}
                        className="w-full bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 text-orange-300 hover:text-orange-200 transition-all duration-200"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Contacts */}
                <Card 
                  className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEmergencyFolderOpen('emergency_contacts', 'Emergency Contacts')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-4 bg-blue-600/20 rounded-full group-hover:bg-blue-600/30 transition-colors">
                        <Phone className="h-8 w-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-blue-300 transition-colors">Emergency Contacts</h3>
                        <p className="text-sm text-muted-foreground mt-1">Key personnel and external contacts</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {emergencyDocumentCounts.emergency_contacts || 0} documents
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmergencyUpload('emergency_contacts', 'Emergency Contacts');
                        }}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-300 hover:text-blue-200 transition-all duration-200"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Equipment */}
                <Card 
                  className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEmergencyFolderOpen('equipment', 'Equipment')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-4 bg-green-600/20 rounded-full group-hover:bg-green-600/30 transition-colors">
                        <Package className="h-8 w-8 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-green-300 transition-colors">Equipment</h3>
                        <p className="text-sm text-muted-foreground mt-1">Fire extinguishers, AEDs, and safety gear</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {emergencyDocumentCounts.equipment || 0} documents
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmergencyUpload('equipment', 'Equipment');
                        }}
                        className="w-full bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-300 hover:text-green-200 transition-all duration-200"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Life Safety Documents */}
                <Card 
                  className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEmergencyFolderOpen('life_safety', 'Life Safety Documents')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-4 bg-purple-600/20 rounded-full group-hover:bg-purple-600/30 transition-colors">
                        <Heart className="h-8 w-8 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-purple-300 transition-colors">Life Safety Documents</h3>
                        <p className="text-sm text-muted-foreground mt-1">Certifications and compliance records</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {emergencyDocumentCounts.life_safety || 0} documents
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmergencyUpload('life_safety', 'Life Safety Documents');
                        }}
                        className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 text-purple-300 hover:text-purple-200 transition-all duration-200"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Floor Plans */}
                <Card 
                  className="bg-card border-border shadow-sm hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEmergencyFolderOpen('floor_plans', 'Floor Plans')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="p-4 bg-cyan-600/20 rounded-full group-hover:bg-cyan-600/30 transition-colors">
                        <MapIcon2 className="h-8 w-8 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-cyan-300 transition-colors">Floor Plans</h3>
                        <p className="text-sm text-muted-foreground mt-1">Emergency-specific floor layouts</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        {emergencyDocumentCounts.floor_plans || 0} documents
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmergencyUpload('floor_plans', 'Floor Plans');
                        }}
                        className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/50 text-cyan-300 hover:text-cyan-200 transition-all duration-200"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Status Overview */}
              <Card className="bg-card border-border shadow-sm mt-8">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold text-card-foreground flex items-center">
                    <AlertTriangle className="h-5 w-5 text-amber-400 mr-2" />
                    Emergency Preparedness Status
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Overall readiness and compliance overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">0%</div>
                      <div className="text-sm text-muted-foreground">Documentation Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">--</div>
                      <div className="text-sm text-muted-foreground">Last Safety Drill</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">--</div>
                      <div className="text-sm text-muted-foreground">Next Inspection</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Common emergency management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      className="border-red-700 text-red-400 hover:bg-red-950/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Emergency Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-orange-700 text-orange-400 hover:bg-orange-950/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Evacuation Route
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-blue-700 text-blue-400 hover:bg-blue-950/50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Emergency Contact
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
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

      {/* Share Facility Modal */}
      <ShareFacilityModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        facility={facility}
        onShare={handleShare}
      />

      {/* Emergency Document Upload Modal */}
      {selectedEmergencyCategory && (
        <UploadEmergencyDocumentModal
          isOpen={isEmergencyUploadModalOpen}
          onClose={() => {
            setIsEmergencyUploadModalOpen(false);
            setSelectedEmergencyCategory(null);
          }}
          facilityId={facilityId}
          category={selectedEmergencyCategory.category}
          categoryName={selectedEmergencyCategory.name}
          onSuccess={handleEmergencyUploadSuccess}
        />
      )}

      {/* Emergency Documents View Modal */}
      {selectedEmergencyCategory && (
        <EmergencyDocumentsView
          isOpen={isEmergencyDocumentsViewOpen}
          onClose={() => {
            setIsEmergencyDocumentsViewOpen(false);
            setSelectedEmergencyCategory(null);
          }}
          facilityId={facilityId}
          category={selectedEmergencyCategory.category}
          categoryName={selectedEmergencyCategory.name}
          categoryIcon={
            selectedEmergencyCategory.category === 'emergency_plan' ? <Shield className="h-5 w-5 text-red-400" /> :
            selectedEmergencyCategory.category === 'evacuation_routes' ? <Route className="h-5 w-5 text-orange-400" /> :
            selectedEmergencyCategory.category === 'emergency_contacts' ? <Phone className="h-5 w-5 text-blue-400" /> :
            selectedEmergencyCategory.category === 'equipment' ? <Package className="h-5 w-5 text-green-400" /> :
            selectedEmergencyCategory.category === 'life_safety' ? <Heart className="h-5 w-5 text-purple-400" /> :
            <MapIcon2 className="h-5 w-5 text-cyan-400" />
          }
          categoryColor={
            selectedEmergencyCategory.category === 'emergency_plan' ? 'bg-red-600/20' :
            selectedEmergencyCategory.category === 'evacuation_routes' ? 'bg-orange-600/20' :
            selectedEmergencyCategory.category === 'emergency_contacts' ? 'bg-blue-600/20' :
            selectedEmergencyCategory.category === 'equipment' ? 'bg-green-600/20' :
            selectedEmergencyCategory.category === 'life_safety' ? 'bg-purple-600/20' :
            'bg-cyan-600/20'
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-background text-foreground border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">Delete Facility</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this facility? This action cannot be undone.
              All associated buildings, rooms, and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">
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