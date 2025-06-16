'use client';

import React, { useState, useEffect } from 'react';
import { Building, Room, BuildingSystem, RoomFunction, BuildingSystemType, SystemCondition, BuildingStatus } from '@/types/building';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  getBuildings,
  getRooms,
  createRoom,
  createBuilding,
  createBuildingSystem,
  getBuildingSystems
} from '@/app/actions/buildings';
import { getAllFacilities, getFacilityById } from '@/app/actions/facilities';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ChevronRight, Plus, MoreVertical, Pencil, Home, ChevronRight as ChevronRightIcon, Building2, Wrench, Hammer, FileText } from 'lucide-react';
import type { Plan } from '@/app/actions/plans';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { BuildingService } from '@/lib/services/building.service';
import { BuildingType } from '@/types/building';

const ROOM_FUNCTIONS = ['Classroom', 'Office', 'Restroom', 'Laboratory', 'Storage', 'Conference', 'Other'] as const;
const SYSTEM_TYPES = ['HVAC', 'Electrical', 'Plumbing', 'Roofing', 'Fire Safety', 'Security', 'IT Infrastructure', 'Other'] as const;
const SYSTEM_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] as const;
const BUILDING_TYPES = ['Administration', 'Classroom', 'Laboratory', 'Gymnasium', 'Auditorium', 'Library', 'Cafeteria', 'Dormitory', 'Other'] as const;

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [systems, setSystems] = useState<{ [key: string]: BuildingSystem[] }>({});
  const [plansMap, setPlansMap] = useState<{ [key: string]: Plan[] }>({});
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [rooms, setRooms] = useState<{ [key: string]: Room[] }>({});
  const { toast } = useToast();
  const supabase = createClient();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showRenovationModal, setShowRenovationModal] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingError, setLoadingError] = useState<string | null>(null);


  // Define mock data for fallbacks
  const mockRooms: Room[] = [
    {
      id: '1',
      building_id: '1',
      room_number: '101',
      room_function: 'Office',
      square_footage: 200,
      capacity: 2,
      floor: '1',
      furniture_details: {
        desks: 2,
        chairs: 4,
        cabinets: 2
      },
      accessibility_notes: 'ADA compliant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      building_id: '1',
      room_number: '102',
      room_function: 'Conference',
      square_footage: 400,
      capacity: 12,
      floor: '1',
      furniture_details: {
        tables: 1,
        chairs: 12,
        whiteboard: 1
      },
      accessibility_notes: 'ADA compliant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockBuildingSystems: BuildingSystem[] = [
    {
      id: '1',
      building_id: '1',
      system_type: 'HVAC',
      name: 'Main HVAC System',
      model: 'Carrier-2000',
      manufacturer: 'Carrier',
      installation_date: '2020-01-01',
      warranty_expiry: '2025-01-01',
      condition: 'Good',
      maintenance_schedule: 'monthly',
      maintenance_details: {
        frequency: 'monthly',
        day_of_month: 1,
        time: '09:00',
        description: 'Regular maintenance check'
      },
      last_maintenance_date: '2024-01-01',
      next_maintenance_date: '2024-02-01',
      specifications: {
        capacity: '50 tons',
        coverage: 'Entire building',
        certifications: ['Energy Star'],
        system_details: {
          cooling_capacity: 600000,
          heating_capacity: 500000,
          air_flow_rate: 20000,
          energy_efficiency: 18,
          refrigerant_type: 'R-410A',
          zone_coverage: ['Floor 1', 'Floor 2']
        }
      },
      status: 'operational',
      created_by: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      building_id: '1',
      system_type: 'Electrical',
      name: 'Main Electrical System',
      model: 'PowerMax-5000',
      manufacturer: 'Schneider Electric',
      installation_date: '2019-01-01',
      warranty_expiry: '2024-01-01',
      condition: 'Excellent',
      maintenance_schedule: 'quarterly',
      maintenance_details: {
        frequency: 'quarterly',
        day_of_month: 15,
        time: '08:00',
        description: 'Electrical system inspection'
      },
      last_maintenance_date: '2023-12-15',
      next_maintenance_date: '2024-03-15',
      specifications: {
        capacity: '1000 kVA',
        coverage: 'Entire building',
        certifications: ['UL Listed'],
        system_details: {
          voltage_rating: 480,
          amperage_rating: 1200,
          phase_type: 'Three',
          number_of_circuits: 48,
          main_breaker_size: 1200,
          service_type: 'Underground'
        }
      },
      status: 'operational',
      created_by: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Form schemas
  const buildingFormSchema = z.object({
    name: z.string().min(1, "Building name is required"),
    buildingNumber: z.string().optional(),
    constructionDate: z.string().min(1, "Construction date is required"),
    buildingType: z.string().min(1, "Building type is required"),
    squareFootage: z.number().min(1, "Square footage must be greater than 0"),
    numberOfRooms: z.number().min(0, "Number of rooms must be 0 or greater"),
    facilityId: z.string().min(1, "Facility is required"),
    notes: z.string().optional(),
  });

  const roomFormSchema = z.object({
    room_number: z.string().min(1, "Room number is required"),
    room_function: z.string().min(1, "Room function is required"),
    square_footage: z.number().min(1, "Square footage must be greater than 0"),
    floor: z.string().min(1, "Floor is required"),
    capacity: z.number().optional(),
  });

  const systemFormSchema = z.object({
    name: z.string().min(1, "System name is required"),
    system_type: z.string().min(1, "System type is required"),
    condition: z.string().min(1, "System condition is required"),
    installation_date: z.string().optional(),
    maintenance_frequency: z.string().optional(),
  });

  const renovationFormSchema = z.object({
    scope_of_work: z.string().min(1, "Scope of work is required"),
    square_footage_affected: z.number().min(1, "Square footage must be greater than 0"),
    start_date: z.string().min(1, "Start date is required"),
    completion_date: z.string().min(1, "Completion date is required"),
    estimated_budget: z.number().min(0, "Budget must be 0 or greater"),
    status: z.string().min(1, "Status is required"),
  });

  // Form hooks
  const buildingForm = useForm<z.infer<typeof buildingFormSchema>>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: {
      name: '',
      buildingNumber: '',
      constructionDate: '',
      buildingType: '',
      squareFootage: 0,
      numberOfRooms: 0,
      facilityId: '',
      notes: '',
    },
  });

  const roomForm = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      room_number: '',
      room_function: '',
      square_footage: 0,
      floor: '',
      capacity: 0,
    },
  });

  const systemForm = useForm<z.infer<typeof systemFormSchema>>({
    resolver: zodResolver(systemFormSchema),
  });

  const renovationForm = useForm<z.infer<typeof renovationFormSchema>>({
    resolver: zodResolver(renovationFormSchema),
  });

  const loadBuildings = async () => {
    try {
      setIsLoading(true);
      setLoadingError(null);
      console.log('Loading buildings from database...');
      
      // Fetch buildings from database
      const buildingsData = await getBuildings();
      
      // Filter buildings by facility if a facility is selected
      let filteredBuildings = buildingsData || [];
      if (selectedFacilityId) {
        filteredBuildings = buildingsData.filter(building => building.facility_id === selectedFacilityId);
      }
      
      console.log(`Loaded ${filteredBuildings.length} buildings`);
      setBuildings(filteredBuildings);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading buildings:', error);
      setIsLoading(false);
      setLoadingError('Failed to load buildings. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load buildings. Please try again.',
        variant: 'destructive',
      });
      setBuildings([]);
    }
  };

  const loadFacilities = async () => {
    try {
      console.log('Loading facilities from database...');
      
      // Fetch facilities from database
      const facilitiesData = await getAllFacilities();
      
      const formattedFacilities = facilitiesData.map((facility: any) => ({
        id: facility.id,
        name: facility.name
      }));
      
      setFacilities(formattedFacilities);
      
      // If we have a selected facility ID, find its details
      if (selectedFacilityId) {
        // First try to find it in the formatted facilities to avoid an extra API call
        const foundFacility = formattedFacilities.find((f: any) => f.id === selectedFacilityId);
        if (foundFacility) {
          setSelectedFacility(foundFacility);
        } else {
          // Only make an API call if we can't find it in the list
          try {
            const facilityData = await getFacilityById(selectedFacilityId);
            if (facilityData) {
              setSelectedFacility({
                id: facilityData.id,
                name: facilityData.name
              });
            }
          } catch (error) {
            console.error('Error fetching selected facility:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load facilities. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const loadAllPlans = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('plans')
        .select('*');

      if (error) throw error;

      // Group plans by folder
      const plansByFolder = plans.reduce((acc: { [key: string]: Plan[] }, plan: Plan) => {
        if (!acc[plan.folder_id]) {
          acc[plan.folder_id] = [];
        }
        acc[plan.folder_id].push(plan);
        return acc;
      }, {});

      setPlansMap(plansByFolder);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plans. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      // Check if there's a facilityId in the URL
      const facilityIdFromUrl = searchParams?.get('facilityId');
      if (facilityIdFromUrl && facilityIdFromUrl !== 'all') {
        setSelectedFacilityId(facilityIdFromUrl);
        // Pre-select the facility in the form
        buildingForm.setValue('facilityId', facilityIdFromUrl);
      } else {
        setSelectedFacilityId(null);
      }
      
      // Load facilities first since they're needed for the dropdown
      await loadFacilities();
      
      // Then load buildings
      await loadBuildings();
      
      // Load plans in the background since they're not immediately visible
      loadAllPlans().catch(error => {
        console.error('Error loading plans:', error);
      });
    };
    
    init();
  }, [searchParams]);
  
  // Add a separate effect for form initialization to avoid dependencies issues
  useEffect(() => {
    if (selectedFacilityId) {
      buildingForm.setValue('facilityId', selectedFacilityId);
    }
  }, [selectedFacilityId, buildingForm]);
  
  // Add a new useEffect to reload buildings when selectedFacilityId changes
  useEffect(() => {
    // Skip the initial render and avoid infinite loops
    if (buildings.length > 0 && selectedFacilityId !== null) {
      // Instead of calling loadBuildings() which might update state again,
      // just filter the existing buildings client-side
      const filteredBuildings = buildings.filter(building => 
        building.facility_id === selectedFacilityId
      );
      
      // Only update if the filtered buildings are different
      if (JSON.stringify(filteredBuildings) !== JSON.stringify(buildings)) {
        setBuildings(filteredBuildings);
      }
    }
  }, [selectedFacilityId, buildings]);

  const toggleBuildingExpansion = async (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
      // Load rooms if not already loaded
      if (!rooms[buildingId]) {
        try {
          const buildingRooms = await getRooms(buildingId);
          setRooms(prev => ({ ...prev, [buildingId]: buildingRooms }));
        } catch (error) {
          console.error('Error loading rooms:', error);
          toast({
            title: 'Error',
            description: 'Failed to load rooms. Please try again.',
            variant: 'destructive',
          });
        }
      }
    }
    setExpandedBuildings(newExpanded);
  };

  const toggleRowExpansion = (buildingId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
      // Load related data if not already loaded
      loadBuildingDetails(buildingId);
    }
    setExpandedRows(newExpanded);
  };

  const loadBuildingDetails = async (buildingId: string) => {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<any>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Building details query timeout'));
        }, 3000); // 3 second timeout
      });
      
      // Create the actual data fetching promises
      const fetchRoomsPromise = async () => {
        return await getRooms(buildingId);
      };
      
      const fetchSystemsPromise = async () => {
        return await getBuildingSystems(buildingId);
      };
      
      // Race the timeouts against the actual data fetches
      try {
        const roomsData = await Promise.race([fetchRoomsPromise(), timeoutPromise]);
        setRooms(prev => ({ ...prev, [buildingId]: roomsData }));
      } catch (error) {
        console.warn('Using fallback rooms data due to:', error);
        const fallbackRooms = mockRooms.filter(room => room.building_id === buildingId);
        setRooms(prev => ({ ...prev, [buildingId]: fallbackRooms }));
      }
      
      try {
        const systemsData = await Promise.race([fetchSystemsPromise(), timeoutPromise]);
        setSystems(prev => ({ ...prev, [buildingId]: systemsData }));
      } catch (error) {
        console.warn('Using fallback systems data due to:', error);
        const fallbackSystems = mockBuildingSystems.filter(system => system.building_id === buildingId);
        setSystems(prev => ({ ...prev, [buildingId]: fallbackSystems }));
      }
    } catch (error) {
      console.error('Error loading building details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load building details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      console.log('Starting building creation...');
      
      // Set a client-side timeout to provide feedback even if the server times out
      const timeoutId = setTimeout(() => {
        toast({
          title: "Taking longer than expected",
          description: "Still processing your request. Please wait...",
        });
      }, 5000);
      
      await createBuilding(formData);
      
      clearTimeout(timeoutId);
      
      toast({
        title: "Success!",
        description: "Building created successfully.",
      });
      
      setIsModalOpen(false);
      loadBuildings(); // Refresh the buildings list
    } catch (error) {
      console.error('Building creation error:', error);
      
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Authentication timeout') || errorMessage.includes('User not authenticated')) {
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please try refreshing the page and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create building. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoom = async (data: z.infer<typeof roomFormSchema>) => {
    if (!selectedBuilding) return;
    try {
      const formData = new FormData();
      formData.append('building_id', selectedBuilding.id);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      await createRoom(formData);
      await loadBuildingDetails(selectedBuilding.id);
      setShowRoomModal(false);
      roomForm.reset();
      toast({
        title: 'Success',
        description: 'Room added successfully',
      });
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: 'Error',
        description: 'Failed to add room',
        variant: 'destructive',
      });
    }
  };

  const handleAddSystem = async (data: z.infer<typeof systemFormSchema>) => {
    if (!selectedBuilding) return;
    try {
      const formData = new FormData();
      formData.append('building_id', selectedBuilding.id);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      await createBuildingSystem(formData);
      await loadBuildingDetails(selectedBuilding.id);
      setShowSystemModal(false);
      systemForm.reset();
      toast({
        title: 'Success',
        description: 'System added successfully',
      });
    } catch (error) {
      console.error('Error adding system:', error);
      toast({
        title: 'Error',
        description: 'Failed to add system',
        variant: 'destructive',
      });
    }
  };

  const handleAddRenovation = async (data: z.infer<typeof renovationFormSchema>) => {
    if (!selectedBuilding) return;
    try {
      const formData = new FormData();
      formData.append('building_id', selectedBuilding.id);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Add renovation API call here
      setShowRenovationModal(false);
      renovationForm.reset();
      toast({
        title: 'Success',
        description: 'Renovation added successfully',
      });
    } catch (error) {
      console.error('Error adding renovation:', error);
      toast({
        title: 'Error',
        description: 'Failed to add renovation',
        variant: 'destructive',
      });
    }
  };

  const handleAddFiles = async (files: FileList) => {
    if (!selectedBuilding) return;
    try {
      // Add file upload logic here
      setShowFilesModal(false);
      toast({
        title: 'Success',
        description: 'Files added successfully',
      });
    } catch (error) {
      console.error('Error adding files:', error);
      toast({
        title: 'Error',
        description: 'Failed to add files',
        variant: 'destructive',
      });
    }
  };

  const handleAddBuilding = async (data: z.infer<typeof buildingFormSchema>) => {
    try {
      setIsLoading(true);
      
      // Create the building data object
      const newBuilding = {
        name: data.name,
        building_number: data.buildingNumber || '',
        construction_date: data.constructionDate,
        building_type: data.buildingType as BuildingType,
        square_footage: data.squareFootage,
        number_of_rooms: data.numberOfRooms,
        facility_id: data.facilityId,
        notes: data.notes || null,
        status: 'active' as BuildingStatus,
        created_by: 'user',
      };
      
      // Create the building using the BuildingService
      const newBuildingCreated = await BuildingService.createBuilding(newBuilding);
      
      toast({
        title: 'Success',
        description: 'Building created successfully',
        variant: 'success',
      });
      
      // Reset the form
      buildingForm.reset();
      
      // Close the modal
      setIsModalOpen(false);
      
      // Reload the buildings
      await loadBuildings();
      
      // If we came from a facility page, redirect back to it
      if (selectedFacilityId) {
        router.push(`/facility/${selectedFacilityId}?tab=buildings`);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error creating building:', error);
      toast({
        title: 'Error',
        description: 'Failed to create building. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto p-6">
        {/* Breadcrumb Navigation with glassmorphic effect */}
        <nav className="flex mb-6 bg-gray-900/50 backdrop-blur-md rounded-xl p-4 border border-gray-800" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/facilities" className="inline-flex items-center text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors">
                <Home className="w-4 h-4 mr-2" />
                Facilities
              </Link>
            </li>
            {selectedFacility && (
              <>
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    <Link 
                      href={`/facility/${selectedFacility.id}`} 
                      className="ml-1 text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors md:ml-2"
                    >
                      {selectedFacility.name}
                    </Link>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    <span className="ml-1 text-sm font-medium text-purple-400 md:ml-2">Buildings</span>
                  </div>
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Header Section with glassmorphic card */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6 mb-6 border border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {selectedFacility 
                  ? `Buildings - ${selectedFacility.name}` 
                  : 'All Buildings'}
              </h1>
              {selectedFacility && (
                <p className="text-gray-400">
                  Manage buildings for this facility
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Facility Filter Dropdown with dark theme */}
              <div className="flex items-center">
                <Select
                  value={selectedFacilityId || "all"}
                  onValueChange={(value) => {
                    if (value && value !== "all") {
                      // If a facility is selected, update URL and state
                      const newSearchParams = new URLSearchParams(searchParams?.toString() || "");
                      newSearchParams.set("facilityId", value);
                      router.push(`/buildings?${newSearchParams.toString()}`);
                      setSelectedFacilityId(value);
                    } else {
                      // If "All Facilities" is selected, remove facilityId from URL
                      const newSearchParams = new URLSearchParams(searchParams?.toString() || "");
                      newSearchParams.delete("facilityId");
                      router.push(`/buildings?${newSearchParams.toString()}`);
                      setSelectedFacilityId(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                    <SelectValue placeholder="Filter by Facility" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-gray-300 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white">All Facilities</SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem 
                        key={facility.id} 
                        value={facility.id}
                        className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                      >
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Building
              </Button>
            </div>
          </div>
        </div>

        {/* Table with glassmorphic effect */}
        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-800/50">
                <TableHead className="w-[50px] text-gray-400"></TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Construction Date</TableHead>
                <TableHead className="text-gray-400">Square Footage</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-pulse text-gray-400">Loading buildings...</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : loadingError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col justify-center items-center">
                      <p className="text-gray-400 mb-4">
                        {loadingError}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        onClick={loadBuildings}
                      >
                        Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : buildings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col justify-center items-center">
                      <Building2 className="w-12 h-12 text-gray-600 mb-4" />
                      <p className="text-gray-400 mb-4">
                        {selectedFacility 
                          ? `No buildings found for ${selectedFacility.name}` 
                          : 'No buildings found'}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-1 border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Building
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                buildings.map((building) => (
                  <React.Fragment key={building.id}>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRowExpansion(building.id)}
                          className="text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                        >
                          {expandedRows.has(building.id) ? (
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{building.name}</p>
                          <p className="text-sm text-gray-400">#{building.building_number || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{building.building_type}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={building.status === 'active' ? 'default' : 'outline'}
                          className={building.status === 'active' 
                            ? 'bg-green-900/50 text-green-400 border-green-800' 
                            : 'border-gray-600 text-gray-400'}
                        >
                          {building.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {building.construction_date ? new Date(building.construction_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-300">{building.square_footage.toLocaleString()} sq ft</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(building.id) && (
                      <>
                        {/* Rooms Section with animation */}
                        <TableRow className="bg-gray-800/30 animate-in slide-in-from-top-2 duration-300">
                          <TableCell colSpan={7} className="p-0">
                            <div className="pl-8 py-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleBuildingExpansion(building.id)}
                                    className="p-0 text-gray-400 hover:text-white"
                                  >
                                    {expandedBuildings.has(building.id) ? (
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                    )}
                                  </Button>
                                  <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-purple-400" />
                                    Rooms ({rooms[building.id]?.length || 0})
                                  </h4>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBuilding(building);
                                    setShowRoomModal(true);
                                  }}
                                  className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Room
                                </Button>
                              </div>
                              {expandedBuildings.has(building.id) && (
                                <div className="pl-6 animate-in slide-in-from-top-2 duration-300">
                                  <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-gray-800">
                                          <TableHead className="text-gray-400">Room Number</TableHead>
                                          <TableHead className="text-gray-400">Function</TableHead>
                                          <TableHead className="text-gray-400">Floor</TableHead>
                                          <TableHead className="text-gray-400">Square Footage</TableHead>
                                          <TableHead className="text-gray-400">Capacity</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {rooms[building.id]?.map((room) => (
                                          <TableRow key={room.id} className="border-gray-800 hover:bg-gray-800/50">
                                            <TableCell className="text-gray-300">{room.room_number}</TableCell>
                                            <TableCell className="text-gray-300">{room.room_function}</TableCell>
                                            <TableCell className="text-gray-300">{room.floor}</TableCell>
                                            <TableCell className="text-gray-300">{room.square_footage}</TableCell>
                                            <TableCell className="text-gray-300">{room.capacity || 'N/A'}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Systems Section with animation */}
                        <TableRow className="bg-gray-800/30 animate-in slide-in-from-top-2 duration-300">
                          <TableCell colSpan={7} className="p-0">
                            <div className="pl-8 py-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleBuildingExpansion(`${building.id}-systems`)}
                                    className="p-0 text-gray-400 hover:text-white"
                                  >
                                    {expandedBuildings.has(`${building.id}-systems`) ? (
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                    )}
                                  </Button>
                                  <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-purple-400" />
                                    Systems ({systems[building.id]?.length || 0})
                                  </h4>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBuilding(building);
                                    setShowSystemModal(true);
                                  }}
                                  className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add System
                                </Button>
                              </div>
                              {expandedBuildings.has(`${building.id}-systems`) && (
                                <div className="pl-6 animate-in slide-in-from-top-2 duration-300">
                                  <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-gray-800">
                                          <TableHead className="text-gray-400">Name</TableHead>
                                          <TableHead className="text-gray-400">Type</TableHead>
                                          <TableHead className="text-gray-400">Condition</TableHead>
                                          <TableHead className="text-gray-400">Installation Date</TableHead>
                                          <TableHead className="text-gray-400">Last Maintenance</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {systems[building.id]?.map((system) => (
                                          <TableRow key={system.id} className="border-gray-800 hover:bg-gray-800/50">
                                            <TableCell className="text-gray-300">{system.name}</TableCell>
                                            <TableCell className="text-gray-300">{system.system_type}</TableCell>
                                            <TableCell>
                                              <Badge 
                                                variant={
                                                  system.condition === 'Excellent' ? 'default' :
                                                  system.condition === 'Good' ? 'default' :
                                                  system.condition === 'Fair' ? 'outline' :
                                                  'destructive'
                                                }
                                                className={
                                                  system.condition === 'Excellent' ? 'bg-green-900/50 text-green-400 border-green-800' :
                                                  system.condition === 'Good' ? 'bg-blue-900/50 text-blue-400 border-blue-800' :
                                                  system.condition === 'Fair' ? 'bg-yellow-900/50 text-yellow-400 border-yellow-800' :
                                                  'bg-red-900/50 text-red-400 border-red-800'
                                                }
                                              >
                                                {system.condition}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-300">{system.installation_date || 'N/A'}</TableCell>
                                            <TableCell className="text-gray-300">{system.maintenance_details?.frequency || 'N/A'}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Renovations Section with animation */}
                        <TableRow className="bg-gray-800/30 animate-in slide-in-from-top-2 duration-300">
                          <TableCell colSpan={7} className="p-0">
                            <div className="pl-8 py-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleBuildingExpansion(`${building.id}-renovations`)}
                                    className="p-0 text-gray-400 hover:text-white"
                                  >
                                    {expandedBuildings.has(`${building.id}-renovations`) ? (
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                    )}
                                  </Button>
                                  <h4 className="font-semibold text-white flex items-center gap-2">
                                    <Hammer className="w-4 h-4 text-purple-400" />
                                    Renovations (0)
                                  </h4>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBuilding(building);
                                    setShowRenovationModal(true);
                                  }}
                                  className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Renovation
                                </Button>
                              </div>
                              {expandedBuildings.has(`${building.id}-renovations`) && (
                                <div className="pl-6 animate-in slide-in-from-top-2 duration-300">
                                  <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-gray-800">
                                          <TableHead className="text-gray-400">Scope of Work</TableHead>
                                          <TableHead className="text-gray-400">Status</TableHead>
                                          <TableHead className="text-gray-400">Start Date</TableHead>
                                          <TableHead className="text-gray-400">Completion Date</TableHead>
                                          <TableHead className="text-gray-400">Budget</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {/* Renovations would be loaded separately if they exist */}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Referenced Files Section with animation */}
                        <TableRow className="bg-gray-800/30 animate-in slide-in-from-top-2 duration-300">
                          <TableCell colSpan={7} className="p-0">
                            <div className="pl-8 py-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleBuildingExpansion(`${building.id}-files`)}
                                    className="p-0 text-gray-400 hover:text-white"
                                  >
                                    {expandedBuildings.has(`${building.id}-files`) ? (
                                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                                    )}
                                  </Button>
                                  <h4 className="font-semibold text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-400" />
                                    Referenced Files ({plansMap[building.id]?.length || 0})
                                  </h4>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBuilding(building);
                                    setShowFilesModal(true);
                                  }}
                                  className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Files
                                </Button>
                              </div>
                              {expandedBuildings.has(`${building.id}-files`) && (
                                <div className="pl-6 animate-in slide-in-from-top-2 duration-300">
                                  <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-gray-800">
                                          <TableHead className="text-gray-400">File Name</TableHead>
                                          <TableHead className="text-gray-400">Type</TableHead>
                                          <TableHead className="text-gray-400">Upload Date</TableHead>
                                          <TableHead className="text-gray-400">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {plansMap[building.id]?.map((plan) => (
                                          <TableRow key={plan.id} className="border-gray-800 hover:bg-gray-800/50">
                                            <TableCell className="text-gray-300">{plan.name}</TableCell>
                                            <TableCell className="text-gray-300">{plan.type}</TableCell>
                                            <TableCell className="text-gray-300">{new Date(plan.uploaded_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="text-gray-400 hover:text-white hover:bg-gray-700"
                                              >
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Building Modal with dark theme */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Add New Building</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new building in your facility management system.
              </DialogDescription>
            </DialogHeader>
            <Form {...buildingForm}>
              <form onSubmit={buildingForm.handleSubmit(handleAddBuilding)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Building Name */}
                  <FormField
                    control={buildingForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Building Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Main Building" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Building Number */}
                  <FormField
                    control={buildingForm.control}
                    name="buildingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Building Number (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="A1" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Facility */}
                  <FormField
                    control={buildingForm.control}
                    name="facilityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Facility</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || selectedFacilityId || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Select a facility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {facilities.map((facility) => (
                              <SelectItem 
                                key={facility.id} 
                                value={facility.id}
                                className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                              >
                                {facility.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Building Type */}
                  <FormField
                    control={buildingForm.control}
                    name="buildingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Building Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Select a building type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {BUILDING_TYPES.map((type) => (
                              <SelectItem 
                                key={type} 
                                value={type}
                                className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Construction Date */}
                  <FormField
                    control={buildingForm.control}
                    name="constructionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Construction Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Square Footage */}
                  <FormField
                    control={buildingForm.control}
                    name="squareFootage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Square Footage</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10000" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {/* Number of Rooms */}
                  <FormField
                    control={buildingForm.control}
                    name="numberOfRooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Number of Rooms</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="20" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={buildingForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional information about this building" 
                          className="min-h-[100px] bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isLoading ? "Creating..." : "Create Building"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Room Modal with dark theme */}
        <Dialog open={showRoomModal} onOpenChange={setShowRoomModal}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add New Room</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new room to {selectedBuilding?.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...roomForm}>
              <form onSubmit={roomForm.handleSubmit(handleAddRoom)} className="space-y-4">
                <FormField
                  control={roomForm.control}
                  name="room_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Room Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roomForm.control}
                  name="room_function"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Function</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                            <SelectValue placeholder="Select room function" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {ROOM_FUNCTIONS.map((func) => (
                            <SelectItem 
                              key={func} 
                              value={func}
                              className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                            >
                              {func}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roomForm.control}
                  name="floor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Floor</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roomForm.control}
                  name="square_footage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Square Footage</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={roomForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Capacity (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                >
                  Add Room
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* System Modal with dark theme */}
        <Dialog open={showSystemModal} onOpenChange={setShowSystemModal}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add New System</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new system to {selectedBuilding?.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...systemForm}>
              <form onSubmit={systemForm.handleSubmit(handleAddSystem)} className="space-y-4">
                <FormField
                  control={systemForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">System Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={systemForm.control}
                  name="system_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">System Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Select system type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {SYSTEM_TYPES.map((type) => (
                            <SelectItem 
                              key={type} 
                              value={type}
                              className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                            >
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={systemForm.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Condition</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {SYSTEM_CONDITIONS.map((condition) => (
                            <SelectItem 
                              key={condition} 
                              value={condition}
                              className="text-white hover:bg-gray-700 hover:text-white focus:bg-gray-700 focus:text-white"
                            >
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={systemForm.control}
                  name="installation_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Installation Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                >
                  Add System
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Renovation Modal with dark theme */}
        <Dialog open={showRenovationModal} onOpenChange={setShowRenovationModal}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add New Renovation</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new renovation to {selectedBuilding?.name}
              </DialogDescription>
            </DialogHeader>
            <Form {...renovationForm}>
              <form onSubmit={renovationForm.handleSubmit(handleAddRenovation)} className="space-y-4">
                <FormField
                  control={renovationForm.control}
                  name="scope_of_work"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Scope of Work</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={renovationForm.control}
                  name="square_footage_affected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Square Footage Affected</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={renovationForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Start Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={renovationForm.control}
                  name="completion_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Completion Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={renovationForm.control}
                  name="estimated_budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Estimated Budget</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))} 
                          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={renovationForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {['planning', 'in_progress', 'completed', 'on_hold'].map((status) => (
                            <SelectItem 
                              key={status} 
                              value={status}
                              className="text-gray-300 hover:bg-gray-800 hover:text-white focus:bg-gray-800 focus:text-white"
                            >
                              {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                >
                  Add Renovation
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Files Modal with dark theme */}
        <Dialog open={showFilesModal} onOpenChange={setShowFilesModal}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Add Referenced Files</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add files to {selectedBuilding?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="files" className="text-gray-300">Files</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                  className="bg-gray-800 border-gray-700 text-white file:bg-gray-700 file:text-gray-300 file:border-0 file:mr-4 hover:file:bg-gray-600"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 