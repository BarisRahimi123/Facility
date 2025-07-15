'use client';

import React, { useState, useEffect } from 'react';
import { Building as BuildingType, Room, BuildingSystem, BuildingStatus, BuildingFormData } from '@/types/building';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  getBuildings,
  getRooms,
  createRoom,
  createBuilding,
  createBuildingSystem,
  getBuildingSystems,
  deleteBuilding,
  createRenovation
} from '@/app/actions/buildings';
import { getAllFacilities, getFacilityById } from '@/app/actions/facilities';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight, Plus, MoreVertical, Pencil, Home, ChevronRight as ChevronRightIcon, Building2, Wrench, Hammer, FileText, ChevronUp, ExternalLink, Eye, Trash2, Calendar, ChevronDown } from 'lucide-react';
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
import { Loader2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { DoorOpen } from 'lucide-react';
import { Edit } from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { AddRoomForm } from '@/components/add-room-form';
import { AddSystemForm } from '@/components/add-system-form';
import { AddRenovationForm } from '@/components/add-renovation-form';
import { EditBuildingForm } from '@/components/edit-building-form';
import { DeleteBuildingForm } from '@/components/delete-building-form';

const ROOM_FUNCTIONS = ['Classroom', 'Office', 'Restroom', 'Laboratory', 'Storage', 'Conference', 'Other'] as const;
const SYSTEM_TYPES = ['HVAC', 'Electrical', 'Plumbing', 'Roofing', 'Fire Safety', 'Security', 'IT Infrastructure', 'Other'] as const;
const SYSTEM_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] as const;
const BUILDING_TYPES = ['Administration', 'Classroom', 'Laboratory', 'Gymnasium', 'Auditorium', 'Library', 'Cafeteria', 'Dormitory', 'Other'] as const;

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [systems, setSystems] = useState<{ [key: string]: BuildingSystem[] }>({});
  const [plansMap, setPlansMap] = useState<{ [key: string]: Plan[] }>({});
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [rooms, setRooms] = useState<{ [key: string]: Room[] }>({});
  const { toast } = useToast();
  const supabase = createClient();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
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
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<BuildingType | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<BuildingType | null>(null);
  const [addingRoomTo, setAddingRoomTo] = useState<BuildingType | null>(null);
  const [addingSystemTo, setAddingSystemTo] = useState<BuildingType | null>(null);
  const [addingRenovationTo, setAddingRenovationTo] = useState<BuildingType | null>(null);

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
    building_number: z.string().optional(),
    construction_date: z.string().min(1, "Construction date is required"),
    building_type: z.enum(['commercial', 'residential', 'industrial', 'educational', 'healthcare', 'mixed_use', 'other'] as const),
    square_footage: z.number().min(1, "Square footage must be greater than 0"),
    number_of_rooms: z.number().min(0, "Number of rooms must be 0 or greater"),
    facility_id: z.string().min(1, "Facility is required"),
    notes: z.string().optional(),
    image_description: z.string().optional(),
    // Restroom information fields for compliance calculations
    boys_toilets: z.number().min(0, "Must be 0 or greater").optional(),
    girls_toilets: z.number().min(0, "Must be 0 or greater").optional(),
    unisex_toilets: z.number().min(0, "Must be 0 or greater").optional(),
    boys_urinals: z.number().min(0, "Must be 0 or greater").optional(),
    girls_urinals: z.number().min(0, "Must be 0 or greater").optional(),
    boys_sinks: z.number().min(0, "Must be 0 or greater").optional(),
    girls_sinks: z.number().min(0, "Must be 0 or greater").optional(),
    unisex_sinks: z.number().min(0, "Must be 0 or greater").optional(),
    boys_restrooms_count: z.number().min(0, "Must be 0 or greater").optional(),
    girls_restrooms_count: z.number().min(0, "Must be 0 or greater").optional(),
    unisex_restrooms_count: z.number().min(0, "Must be 0 or greater").optional(),
    staff_toilets: z.number().min(0, "Must be 0 or greater").optional(),
    staff_sinks: z.number().min(0, "Must be 0 or greater").optional(),
    staff_restrooms_count: z.number().min(0, "Must be 0 or greater").optional(),
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
      building_number: '',
      construction_date: '',
      building_type: 'commercial',
      square_footage: 0,
      number_of_rooms: 0,
      facility_id: '',
      notes: '',
      image_description: '',
      // Restroom information defaults
      boys_toilets: 0,
      girls_toilets: 0,
      unisex_toilets: 0,
      boys_urinals: 0,
      girls_urinals: 0,
      boys_sinks: 0,
      girls_sinks: 0,
      unisex_sinks: 0,
      boys_restrooms_count: 0,
      girls_restrooms_count: 0,
      unisex_restrooms_count: 0,
      staff_toilets: 0,
      staff_sinks: 0,
      staff_restrooms_count: 0,
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
      
      // Filter buildings by facility if a facility is selected and not 'all'
      let filteredBuildings = buildingsData || [];
      if (selectedFacilityId && selectedFacilityId !== 'all') {
        filteredBuildings = buildingsData.filter(building => building.facility_id === selectedFacilityId);
        console.log(`Filtered to ${filteredBuildings.length} buildings for facility ${selectedFacilityId}`);
      } else {
        console.log(`Showing all ${filteredBuildings.length} buildings from all facilities`);
      }
      
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
        buildingForm.setValue('facility_id', facilityIdFromUrl);
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
      buildingForm.setValue('facility_id', selectedFacilityId);
    }
  }, [selectedFacilityId, buildingForm]);
  
  // Reload buildings when selectedFacilityId changes
  useEffect(() => {
    loadBuildings();
  }, [selectedFacilityId]);

  const toggleBuildingExpansion = async (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
      // Load rooms and systems if not already loaded
      if (!rooms[buildingId] || !systems[buildingId]) {
        try {
          // Load rooms
          if (!rooms[buildingId]) {
            const buildingRooms = await getRooms(buildingId);
            setRooms(prev => ({ ...prev, [buildingId]: buildingRooms }));
          }
          
          // Load systems
          if (!systems[buildingId]) {
            const buildingSystems = await getBuildingSystems(buildingId);
            setSystems(prev => ({ ...prev, [buildingId]: buildingSystems }));
          }
        } catch (error) {
          console.error('Error loading building details:', error);
          toast({
            title: 'Error',
            description: 'Failed to load building details. Please try again.',
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
    try {
      const formData = new FormData();
      formData.append('building_id', addingRoomTo!.id);
      formData.append('room_number', data.room_number);
      formData.append('room_function', data.room_function);
      formData.append('square_footage', data.square_footage.toString());
      formData.append('floor', data.floor || '');
      if (data.capacity) formData.append('capacity', data.capacity.toString());
      
      await createRoom(formData);
      await loadBuildings();
      setAddingRoomTo(null);
      toast({
        title: "Success",
        description: "Room added successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error adding room:', error);
      toast({
        title: "Error",
        description: "Failed to add room",
        variant: "destructive"
      });
    }
  };

  const handleAddSystem = async (data: z.infer<typeof systemFormSchema>) => {
    try {
      const formData = new FormData();
      formData.append('building_id', addingSystemTo!.id);
      formData.append('name', data.name);
      formData.append('system_type', data.system_type);
      formData.append('condition', data.condition);
      if (data.installation_date) formData.append('installation_date', data.installation_date);
      if (data.maintenance_frequency) formData.append('maintenance_frequency', data.maintenance_frequency);
      
      await createBuildingSystem(formData);
      await loadBuildings();
      setAddingSystemTo(null);
      toast({
        title: "Success",
        description: "System added successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error adding system:', error);
      toast({
        title: "Error",
        description: "Failed to add system",
        variant: "destructive"
      });
    }
  };

  const handleAddRenovation = async (data: z.infer<typeof renovationFormSchema>) => {
    try {
      const formData = new FormData();
      formData.append('building_id', addingRenovationTo!.id);
      formData.append('scope_of_work', data.scope_of_work);
      formData.append('square_footage_affected', data.square_footage_affected.toString());
      formData.append('start_date', data.start_date);
      formData.append('completion_date', data.completion_date);
      formData.append('estimated_budget', data.estimated_budget.toString());
      formData.append('status', data.status);
      
      await createRenovation(addingRenovationTo!.id, formData);
      await loadBuildings();
      setAddingRenovationTo(null);
      toast({
        title: "Success",
        description: "Renovation added successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error adding renovation:', error);
      toast({
        title: "Error",
        description: "Failed to add renovation",
        variant: "destructive"
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
      
      // Create FormData object
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('building_number', data.building_number || '');
      formData.append('construction_date', data.construction_date);
      formData.append('building_type', data.building_type);
      formData.append('square_footage', data.square_footage.toString());
      formData.append('number_of_rooms', data.number_of_rooms.toString());
      formData.append('facility_id', data.facility_id);
      formData.append('notes', data.notes || '');
      formData.append('image_description', data.image_description || '');
      
      // Add restroom information
      if (data.boys_toilets) formData.append('boys_toilets', data.boys_toilets.toString());
      if (data.girls_toilets) formData.append('girls_toilets', data.girls_toilets.toString());
      if (data.unisex_toilets) formData.append('unisex_toilets', data.unisex_toilets.toString());
      if (data.boys_urinals) formData.append('boys_urinals', data.boys_urinals.toString());
      if (data.girls_urinals) formData.append('girls_urinals', data.girls_urinals.toString());
      if (data.boys_sinks) formData.append('boys_sinks', data.boys_sinks.toString());
      if (data.girls_sinks) formData.append('girls_sinks', data.girls_sinks.toString());
      if (data.unisex_sinks) formData.append('unisex_sinks', data.unisex_sinks.toString());
      if (data.boys_restrooms_count) formData.append('boys_restrooms_count', data.boys_restrooms_count.toString());
      if (data.girls_restrooms_count) formData.append('girls_restrooms_count', data.girls_restrooms_count.toString());
      if (data.unisex_restrooms_count) formData.append('unisex_restrooms_count', data.unisex_restrooms_count.toString());
      if (data.staff_toilets) formData.append('staff_toilets', data.staff_toilets.toString());
      if (data.staff_sinks) formData.append('staff_sinks', data.staff_sinks.toString());
      if (data.staff_restrooms_count) formData.append('staff_restrooms_count', data.staff_restrooms_count.toString());

      const newBuilding = await createBuilding(formData);
      
      if (newBuilding) {
        await loadBuildings();
        setIsModalOpen(false);
        toast({
          title: "Success",
          description: "Building created successfully",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Error creating building:', error);
      toast({
        title: "Error",
        description: "Failed to create building",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBuilding = async (updatedBuilding: BuildingType) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      Object.entries(updatedBuilding).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      await createBuilding(formData);
      setEditingBuilding(null);
      loadBuildings();
      toast({
        title: 'Success',
        description: 'Building updated successfully',
        variant: 'success',
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating building:', error);
      toast({
        title: 'Error',
        description: 'Failed to update building. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    try {
      setIsLoading(true);
      await deleteBuilding(buildingId);
      
      setBuildings(prev => prev.filter(b => b.id !== buildingId));
      setDeletingBuilding(null);
      
      toast({
        title: "Success",
        description: "Building deleted successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error deleting building:', error);
      toast({
        title: "Error",
        description: "Failed to delete building",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Breadcrumb Navigation with glassmorphic effect */}
        <nav className="flex mb-6 bg-card/50 backdrop-blur-md rounded-xl p-4 border border-border" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                <Home className="w-4 h-4" />
              </Link>
            </li>
            <li>
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
            </li>
            <li>
              <span className="text-foreground">Buildings</span>
            </li>
            {selectedFacility && (
              <>
                <li>
                  <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                </li>
                <li>
                  <span className="text-foreground">{selectedFacility.name}</span>
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {!selectedFacilityId ? 'All Facilities Buildings' : 'Buildings'}
            </h1>
            <p className="text-muted-foreground">
              {!selectedFacilityId 
                ? `Viewing buildings from all ${facilities.length} facilities`
                : 'Manage your facilities and buildings'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={selectedFacilityId || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  router.push('/buildings');
                  setSelectedFacilityId(null);
                } else {
                  router.push(`/buildings?facilityId=${value}`);
                  setSelectedFacilityId(value);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Facility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities.map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Building
            </Button>
          </div>
        </div>

        {/* Statistics Cards when viewing all facilities */}
        {!selectedFacilityId && buildings.length > 0 && !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Buildings</p>
                  <p className="text-2xl font-bold text-foreground">{buildings.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Home className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Facilities</p>
                  <p className="text-2xl font-bold text-foreground">{facilities.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <DoorOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Rooms</p>
                  <p className="text-2xl font-bold text-foreground">
                    {buildings.reduce((sum, b) => sum + (b.number_of_rooms || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sq Ft</p>
                  <p className="text-2xl font-bold text-foreground">
                    {buildings.reduce((sum, b) => sum + (b.square_footage || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading buildings...</span>
            </div>
          </div>
        )}

        {loadingError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
            <p className="flex items-center gap-2">
              <span className="font-medium">Error:</span>
              {loadingError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBuildings}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {/* Buildings Table */}
        {!isLoading && !loadingError && buildings.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No buildings found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedFacilityId
                ? "This facility doesn't have any buildings yet."
                : "You haven't added any buildings yet."}
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Building
            </Button>
          </div>
        )}

        {!isLoading && !loadingError && buildings.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  {!selectedFacilityId && <TableHead>Facility</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Square Footage</TableHead>
                  <TableHead>Rooms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildings.map((building) => (
                  <React.Fragment key={building.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => toggleBuildingExpansion(building.id)}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          {expandedBuildings.has(building.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          {building.name}
                        </button>
                      </TableCell>
                      {!selectedFacilityId && (
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {facilities.find(f => f.id === building.facility_id)?.name || 'Unknown'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>{building.building_type}</TableCell>
                      <TableCell>{building.square_footage.toLocaleString()} sq ft</TableCell>
                      <TableCell>{building.number_of_rooms}</TableCell>
                      <TableCell>
                        <Badge
                          variant={building.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {building.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingBuilding(building)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Building
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddingRoomTo(building)}>
                              <DoorOpen className="mr-2 h-4 w-4" />
                              Add Room
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddingSystemTo(building)}>
                              <Wrench className="mr-2 h-4 w-4" />
                              Add System
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddingRenovationTo(building)}>
                              <Hammer className="mr-2 h-4 w-4" />
                              Add Renovation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingBuilding(building)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Building
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedBuildings.has(building.id) && (
                      <TableRow>
                        <TableCell colSpan={!selectedFacilityId ? 7 : 6} className="p-0">
                          <div className="bg-accent/50 p-4">
                            <Tabs defaultValue="rooms" className="w-full">
                              <TabsList className="mb-4">
                                <TabsTrigger value="rooms">
                                  <DoorOpen className="w-4 h-4 mr-2" />
                                  Rooms ({rooms[building.id]?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="systems">
                                  <Wrench className="w-4 h-4 mr-2" />
                                  Systems ({systems[building.id]?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="renovations">
                                  <Hammer className="w-4 h-4 mr-2" />
                                  Renovations
                                </TabsTrigger>
                                <TabsTrigger value="files">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Files
                                </TabsTrigger>
                              </TabsList>
                              <TabsContent value="rooms" className="space-y-2">
                                {rooms[building.id] && rooms[building.id].length > 0 ? (
                                  <div className="grid gap-2">
                                    {rooms[building.id].map((room) => (
                                      <div key={room.id} className="bg-card p-3 rounded-lg border border-border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h4 className="font-medium text-sm">Room {room.room_number}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              {room.room_function} • Floor {room.floor} • {room.square_footage} sq ft
                                              {room.capacity && ` • Capacity: ${room.capacity}`}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-center py-4">No rooms added yet</p>
                                )}
                              </TabsContent>
                              <TabsContent value="systems" className="space-y-2">
                                {systems[building.id] && systems[building.id].length > 0 ? (
                                  <div className="grid gap-2">
                                    {systems[building.id].map((system) => (
                                      <div key={system.id} className="bg-card p-3 rounded-lg border border-border">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h4 className="font-medium text-sm">{system.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                              {system.system_type} • Condition: {system.condition}
                                              {system.manufacturer && ` • ${system.manufacturer}`}
                                            </p>
                                          </div>
                                          <Badge variant={system.condition === 'Good' || system.condition === 'Excellent' ? 'default' : 'secondary'}>
                                            {system.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-center py-4">No systems added yet</p>
                                )}
                              </TabsContent>
                              <TabsContent value="renovations">
                                <p className="text-muted-foreground text-center py-4">No renovations scheduled</p>
                              </TabsContent>
                              <TabsContent value="files">
                                <p className="text-muted-foreground text-center py-4">No files uploaded yet</p>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Building Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Building</DialogTitle>
              <DialogDescription>
                Enter the details for the new building. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <Form {...buildingForm}>
              <form onSubmit={buildingForm.handleSubmit(handleAddBuilding)} className="space-y-6">
                {/* Form fields */}
                <Button type="submit" className="w-full">
                  Add Building
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Building Modal */}
        {editingBuilding && (
          <EditBuildingForm
            building={editingBuilding}
            onClose={() => setEditingBuilding(null)}
            onSave={handleSaveBuilding}
          />
        )}

        {/* Delete Building Modal */}
        {deletingBuilding && (
          <DeleteBuildingForm
            building={deletingBuilding}
            onClose={() => setDeletingBuilding(null)}
            onDelete={handleDeleteBuilding}
          />
        )}

        {/* Add Room Modal */}
        {addingRoomTo && (
          <AddRoomForm
            buildingId={addingRoomTo.id}
            onClose={() => setAddingRoomTo(null)}
            onSave={handleAddRoom}
          />
        )}

        {/* Add System Modal */}
        {addingSystemTo && (
          <AddSystemForm
            buildingId={addingSystemTo.id}
            onClose={() => setAddingSystemTo(null)}
            onSave={handleAddSystem}
          />
        )}

        {/* Add Renovation Modal */}
        {addingRenovationTo && (
          <AddRenovationForm
            buildingId={addingRenovationTo.id}
            onClose={() => setAddingRenovationTo(null)}
            onSave={handleAddRenovation}
          />
        )}
      </div>
    </div>
  );
}        