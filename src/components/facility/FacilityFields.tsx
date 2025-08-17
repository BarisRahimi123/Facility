'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Grid3X3, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  Accessibility,
  Lightbulb,
  Car,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Settings,
  Map,
  Search,
  Filter,
  Star,
  Heart,
  ThumbsUp,
  Grid,
  List,
  UserPlus
} from 'lucide-react';
import Image from 'next/image';
import { Field, FieldType, SurfaceType, CreateFieldRequest } from '@/types/field';
import { Room } from '@/types/building';
import { getFields, createField, deleteField, checkFieldsTableExists } from '@/app/actions/fields';
import { getStaffFieldAssignments } from '@/app/actions/staff';
import type { StaffFieldAssignment } from '@/types/staff';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { AddressInput } from '@/components/ui/address-input';
import { AddFieldModal } from '@/components/facility/AddFieldModal';
import { FieldDetailModal } from '@/components/facility/FieldDetailModal';
import { EditFieldModal } from '@/components/facility/EditFieldModal';
import { ReservationsView } from '@/components/facility/ReservationsView';
import AssignStaffToFieldModal from '@/components/facility/AssignStaffToFieldModal';
import { FacilityRentalModal } from '@/components/facility/FacilityRentalModal';
import { FieldCalendarView } from '@/components/facility/FieldCalendarView';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


// Dynamic import for Mapbox component (requires browser APIs)
const MapboxMap = dynamic(() => import('@/components/mapbox/MapboxMap').then(mod => ({ default: mod.MapboxMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p>Loading map...</p>
      </div>
    </div>
  )
});

interface FacilityFieldsProps {
  facilityId: string;
}

export function FacilityFields({ facilityId }: FacilityFieldsProps) {
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  // Staff assignment state
  const [assigningStaffField, setAssigningStaffField] = useState<Field | null>(null);
  const [isStaffAssignModalOpen, setIsStaffAssignModalOpen] = useState(false);
  const [staffAssignments, setStaffAssignments] = useState<StaffFieldAssignment[]>([]);

  // Full-screen rental modal state
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    minPrice: '',
    maxPrice: '',
    hasLighting: false,
    hasParking: false,
    adaCompliant: false
  });

  const [fieldsTableExists, setFieldsTableExists] = useState(false);

  useEffect(() => {
    loadFields();
  }, [facilityId]);

  const loadFields = async () => {
    try {
      setIsLoading(true);
      
      // First check if the table exists
      const tableExists = await checkFieldsTableExists();
      if (!tableExists) {
        setFields([]);
        setNeedsSetup(true);
        setIsLoading(false);
        return;
      }
      
      // Load fields and staff assignments in parallel
      const [fieldsData, assignmentsResponse] = await Promise.all([
        getFields(facilityId),
        getStaffFieldAssignments()
      ]);
      
      setFields(fieldsData);
      
      // Filter assignments for fields in this facility
      if (assignmentsResponse.data) {
        const facilityFieldIds = fieldsData.map(f => f.id);
        const facilityAssignments = assignmentsResponse.data.filter(
          assignment => facilityFieldIds.includes(assignment.field_id)
        );
        setStaffAssignments(facilityAssignments);
      }
      
      setNeedsSetup(false);
    } catch (error) {
      console.error('Error loading fields:', error);
      toast({
        title: "Failed to load fields",
        description: "There was an error loading the facility fields. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateField = async (fieldData: CreateFieldRequest) => {
    try {
      setIsCreating(true);
      
      // First check if the table exists
      const tableExists = await checkFieldsTableExists();
      if (!tableExists) {
        setNeedsSetup(true);
        toast({
          title: "Database setup needed",
          description: "Please apply the fields migration first. See setup instructions on screen.",
          variant: "destructive",
        });
        throw new Error("Database setup needed");
      }

      const field = await createField(fieldData);
      
      // Update fields list
      setFields(prev => [field, ...prev]);
      
      // Reload fields in background - don't let this prevent success
      try {
        await loadFields();
      } catch (error) {
        console.warn('Failed to reload fields:', error);
      }
      
      // Don't close modal - let AddFieldModal handle its own success state
    } catch (error) {
      console.error('Error creating field:', error);
      throw error; // Let the AddFieldModal handle the error display
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!window.confirm('Are you sure you want to delete this field? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteField(fieldId);
      setFields(prev => prev.filter(f => f.id !== fieldId));
      toast({
        title: "Field deleted",
        description: "The field has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: "Failed to delete field",
        description: "There was an error deleting the field. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter fields based on search and filters
  const filteredFields = fields.filter(field => {
    const matchesSearch = field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         field.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filters.type || filters.type === 'all' || field.type === filters.type;
    
    const matchesPrice = (!filters.minPrice || field.hourly_rate >= parseFloat(filters.minPrice)) &&
                        (!filters.maxPrice || field.hourly_rate <= parseFloat(filters.maxPrice));
    
    const matchesFeatures = (!filters.hasLighting || field.has_lighting) &&
                           (!filters.hasParking || field.has_parking) &&
                           (!filters.adaCompliant || field.ada_compliant);
    
    return matchesSearch && matchesType && matchesPrice && matchesFeatures;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      type: 'all',
      minPrice: '',
      maxPrice: '',
      hasLighting: false,
      hasParking: false,
      adaCompliant: false
    });
  };

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case 'soccer':
      case 'football':
        return '⚽';
      case 'basketball':
        return '🏀';
      case 'tennis':
        return '🎾';
      case 'baseball':
        return '⚾';
      case 'pool':
        return '🏊';
      case 'track':
        return '🏃';
      default:
        return '🏟️';
    }
  };

  const getFieldAssignmentCount = (fieldId: string) => {
    return staffAssignments.filter(assignment => assignment.field_id === fieldId).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  // Handle field interactions
  const handleFieldClick = (field: Field) => {
    setSelectedField(field);
    setIsDetailModalOpen(true);  // Open the detail modal on single click
  };

  const handleFieldDoubleClick = (field: Field) => {
    setSelectedField(field);
    setIsRentalModalOpen(true);
  };

  const handleFieldRowDoubleClick = (field: Field) => {
    setSelectedField(field);
    setIsRentalModalOpen(true);
  };

  const formatFieldType = (type: FieldType) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const formatSurfaceType = (surface: SurfaceType | null | undefined) => {
    if (!surface) return 'Not specified';
    return surface.charAt(0).toUpperCase() + surface.slice(1).replace('_', ' ');
  };

  const formatFeatures = (field: Field) => {
    const features = [];
    if (field.has_lighting) features.push('Lighting');
    if (field.has_parking) features.push('Parking');
    if (field.ada_compliant) features.push('ADA Compliant');
    return features.length > 0 ? features.join(', ') : 'None';
  };

  const handleBookField = (field: Field, reservationData?: any) => {
    if (reservationData) {
      // TODO: Implement actual reservation creation
      console.log('Creating reservation:', { field, reservationData });
      toast({
        title: "Reservation submitted",
        description: `Your reservation for ${field.name} has been submitted successfully.`,
      });
    } else {
      // Fallback for simple booking
      toast({
        title: "Booking feature coming soon",
        description: `Booking for ${field.name} will be available soon.`,
      });
    }
  };

  const handleReserveItem = (item: Field | Room, reservationData?: any) => {
    // Check if it's a field and call handleBookField
    if ('facility_id' in item && 'type' in item) {
      handleBookField(item as Field, reservationData);
    } else {
      // Handle room reservation
      const room = item as Room;
      console.log('Creating room reservation:', { room, reservationData });
      toast({
        title: "Reservation submitted",
        description: `Your reservation for room ${room.room_number} has been submitted successfully.`,
      });
    }
  };

  const handleEditField = (field: Field) => {
    setEditingField(field);
  };

  const handleAssignStaff = (field: Field) => {
    setAssigningStaffField(field);
    setIsStaffAssignModalOpen(true);
  };

  const handleFieldUpdate = (updatedField: Field) => {
    // Update the field in the local state
    setFields(prev => prev.map(f => f.id === updatedField.id ? updatedField : f));
    setEditingField(null);
    toast({
      title: "Field updated",
      description: `${updatedField.name} has been updated successfully.`,
    });
  };

  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Rentable Fields</h2>
            <p className="text-muted-foreground mt-1">Manage sports fields, courts, pools, and other rentable areas</p>
          </div>
        </div>
        
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Settings className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="mt-4 text-lg font-medium text-card-foreground">Database Setup Required</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              The fields module requires database tables to be created. Please apply the migration to enable this feature.
            </p>
            
            <div className="mt-8 bg-muted/50 rounded-lg p-6 max-w-2xl mx-auto text-left">
              <h4 className="text-sm font-semibold text-foreground mb-3">Setup Instructions:</h4>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Go to <a href={`https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 'ahntaamtsypranvnofxy'}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">Supabase Dashboard</a></li>
                <li>2. Click "SQL Editor" in the left sidebar</li>
                <li>3. Click "New query"</li>
                <li>4. Copy the migration from: <code className="bg-muted px-2 py-1 rounded">supabase/migrations/20250117_create_fields_and_reservations_tables.sql</code></li>
                <li>5. Paste and run the migration</li>
                <li>6. Refresh this page when complete</li>
              </ol>
            </div>
            
            <Button
              onClick={() => window.location.reload()}
              className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground border-0 rounded-xl px-6 py-3"
            >
              <Settings className="h-4 w-4 mr-2" />
              Refresh After Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading fields...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Rentable Fields</h2>
          <p className="text-muted-foreground mt-1">Manage sports fields, courts, pools, and other rentable areas</p>
        </div>
      </div>

      {/* Tabs for Fields, Customer Preview, Reservations */}
      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="mb-8 bg-muted border border-border p-1 rounded-xl">
          <TabsTrigger 
            value="fields" 
            className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            Field Management
          </TabsTrigger>
          <TabsTrigger 
            value="booking-map"
            className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Customer Preview
          </TabsTrigger>
          <TabsTrigger 
            value="reservations"
            className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Reservations
          </TabsTrigger>
          <TabsTrigger 
            value="calendar"
            className="text-muted-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields" className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Field Management</h3>
              <p className="text-gray-600 dark:text-gray-300 text-base">
                Create and manage your facility's rentable fields. Add photos, set pricing, and configure availability to attract customers.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'card' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-2 rounded-md transition-all ${
                    viewMode === 'card'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Card View
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <List className="h-4 w-4 mr-2" />
                  Table View
                </Button>
              </div>
              
              {/* Add Field Button */}
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-6 py-3 font-medium shadow-sm transition-colors shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>

          <AddFieldModal
            key={isCreateModalOpen ? 'create-field-open' : 'create-field-closed'}
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateField}
            facilityId={facilityId}
          />

          {/* Fields Display - Card or Table View */}
          {fields.length > 0 ? (
            <>
              {viewMode === 'card' ? (
                /* Card View - Hipcamp Style */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fields.map((field) => (
                    <Card 
                      key={field.id} 
                      className="group bg-white dark:bg-white border-0 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                      onClick={() => handleFieldClick(field)}
                      onDoubleClick={() => handleFieldDoubleClick(field)}
                    >
                      <div className="relative">
                        {/* Field Image */}
                        {field.image_url ? (
                          <div className="aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
                            <Image
                              src={field.image_url}
                              alt={field.image_description || field.name}
                              width={400}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center rounded-t-2xl">
                            <div className="text-center">
                              <span className="text-6xl opacity-30">{getFieldTypeIcon(field.type)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Heart Icon - Top Right (Hipcamp Style) */}
                        <div className="absolute top-3 right-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white border-0 shadow-sm"
                          >
                            <Heart className="h-4 w-4 text-gray-600" />
                          </Button>
                        </div>

                        {/* Action Buttons Overlay - Hidden by default, show on hover */}
                        <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white border-0 shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedField(field);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditField(field);
                              }}
                              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white border-0 shadow-sm"
                            >
                              <Edit2 className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignStaff(field);
                              }}
                              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white border-0 shadow-sm"
                              title="Assign Staff"
                            >
                              <UserPlus className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteField(field.id);
                              }}
                              className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-red-50 border-0 shadow-sm"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Content - Hipcamp Style */}
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Rating - Hipcamp Style with thumbs up */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="h-4 w-4 text-gray-700" />
                              <span className="text-sm font-medium text-gray-900">96%</span>
                              <span className="text-sm text-gray-500">(127)</span>
                            </div>
                            {/* Assigned Staff Count */}
                            {getFieldAssignmentCount(field.id) > 0 && (
                              <div className="flex items-center space-x-1 text-blue-600">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  {getFieldAssignmentCount(field.id)} Staff
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Title - Bold and prominent */}
                          <h3 className="font-semibold text-lg text-gray-900 leading-tight">{field.name}</h3>
                          
                          {/* Description line - Hipcamp style */}
                          <p className="text-sm text-gray-700">
                            {field.capacity} capacity • {field.type.charAt(0).toUpperCase() + field.type.slice(1).replace('_', ' ')}, {field.surface_type?.replace('_', ' ')}
                          </p>

                          {/* Location line - Area and location */}
                          <p className="text-sm text-gray-700">
                            {field.area_sq_ft ? `${field.area_sq_ft.toLocaleString()} sq ft` : 'Professional field'} • {field.full_address || field.street_address || 'Premium location'}
                          </p>

                          {/* Features - Simplified */}
                          {(field.has_lighting || field.has_parking || field.ada_compliant) && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {field.has_lighting && (
                                <div className="flex items-center space-x-1">
                                  <span>💡</span>
                                  <span>Lighting</span>
                                </div>
                              )}
                              {field.has_parking && (
                                <div className="flex items-center space-x-1">
                                  <span>🚗</span>
                                  <span>Parking</span>
                                </div>
                              )}
                              {field.ada_compliant && (
                                <div className="flex items-center space-x-1">
                                  <span>♿</span>
                                  <span>ADA</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pricing - Hipcamp style at bottom */}
                          <div className="pt-2">
                            <div className="flex items-baseline">
                              <span className="text-sm text-gray-900">from </span>
                              <span className="text-lg font-semibold text-gray-900">${field.hourly_rate}</span>
                              <span className="text-sm text-gray-700 ml-1">/ hour</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Table View - Detailed Information */
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-foreground font-semibold">Field Name</TableHead>
                          <TableHead className="text-foreground font-semibold">Type</TableHead>
                          <TableHead className="text-foreground font-semibold">Surface</TableHead>
                          <TableHead className="text-foreground font-semibold">Size</TableHead>
                          <TableHead className="text-foreground font-semibold">Capacity</TableHead>
                          <TableHead className="text-foreground font-semibold">Pricing</TableHead>
                          <TableHead className="text-foreground font-semibold">Features</TableHead>
                          <TableHead className="text-foreground font-semibold">Status</TableHead>
                          <TableHead className="text-foreground font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field) => (
                          <TableRow 
                            key={field.id} 
                            className="border-border hover:bg-card/50 cursor-pointer transition-colors"
                            onDoubleClick={() => handleFieldRowDoubleClick(field)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                                  <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground">{field.name}</p>
                                    {getFieldAssignmentCount(field.id) > 0 && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                        {getFieldAssignmentCount(field.id)} Staff
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {field.full_address || field.street_address || 'No address set'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">{formatFieldType(field.type)}</TableCell>
                            <TableCell className="text-foreground">{formatSurfaceType(field.surface_type)}</TableCell>
                            <TableCell className="text-foreground">
                              {field.area_sq_ft ? (
                                <div>
                                  <p>{field.area_sq_ft.toLocaleString()} sq ft</p>
                                  {field.dimensions && (
                                    <p className="text-sm text-muted-foreground">{field.dimensions}</p>
                                  )}
                                </div>
                              ) : (
                                'Not specified'
                              )}
                            </TableCell>
                            <TableCell className="text-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{field.capacity || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              <div>
                                <p className="font-medium">${field.hourly_rate}/hour</p>
                                {field.daily_rate && (
                                  <p className="text-sm text-muted-foreground">${field.daily_rate}/day</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              <div className="flex flex-wrap gap-1">
                                {field.has_lighting && (
                                  <Badge variant="outline" className="text-xs">💡 Lighting</Badge>
                                )}
                                {field.has_parking && (
                                  <Badge variant="outline" className="text-xs">🚗 Parking</Badge>
                                )}
                                {field.ada_compliant && (
                                  <Badge variant="outline" className="text-xs">♿ ADA</Badge>
                                )}
                                {!field.has_lighting && !field.has_parking && !field.ada_compliant && (
                                  <span className="text-sm text-muted-foreground">None</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor('available')} border text-xs`}>
                                Available
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedField(field);
                                    setIsDetailModalOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditField(field);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignStaff(field);
                                  }}
                                  title="Assign Staff"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteField(field.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-white dark:bg-card border-0 rounded-2xl shadow-sm">
              <CardContent className="py-20 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30 rounded-2xl flex items-center justify-center mb-6">
                    <Grid3X3 className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">No fields yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-base mb-8 leading-relaxed">
                    Add your first rentable field to start accepting reservations from customers.
                  </p>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg px-6 py-3 font-medium shadow-sm transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="booking-map" className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Customer Preview Map</h3>
              <p className="text-muted-foreground mt-1">Preview how your fields appear to customers on the public booking map</p>
            </div>
            
            {/* Admin Preview Notice */}
            <div className="flex items-center space-x-2 bg-blue-900/50 border border-blue-700 rounded-lg px-3 py-2">
              <Eye className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">Customer View Preview</span>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search fields by name, type, or features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="w-[140px] bg-muted border-border text-foreground">
                      <SelectValue placeholder="Field Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="all" className="text-foreground hover:bg-accent">All Types</SelectItem>
                      <SelectItem value="soccer" className="text-foreground hover:bg-accent">Soccer</SelectItem>
                      <SelectItem value="football" className="text-foreground hover:bg-accent">Football</SelectItem>
                      <SelectItem value="basketball" className="text-foreground hover:bg-accent">Basketball</SelectItem>
                      <SelectItem value="tennis" className="text-foreground hover:bg-accent">Tennis</SelectItem>
                      <SelectItem value="baseball" className="text-foreground hover:bg-accent">Baseball</SelectItem>
                      <SelectItem value="pool" className="text-foreground hover:bg-accent">Pool</SelectItem>
                      <SelectItem value="track" className="text-foreground hover:bg-accent">Track</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2 bg-muted rounded-lg px-3 py-2">
                    <Input
                      type="number"
                      placeholder="Min $"
                      value={filters.minPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                      className="w-20 h-8 bg-transparent border-0 text-foreground placeholder-muted-foreground p-0"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max $"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                      className="w-20 h-8 bg-transparent border-0 text-foreground placeholder-muted-foreground p-0"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, hasLighting: !prev.hasLighting }))}
                    className={`${filters.hasLighting ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'} hover:bg-primary/90`}
                  >
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Lighting
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, hasParking: !prev.hasParking }))}
                    className={`${filters.hasParking ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'} hover:bg-primary/90`}
                  >
                    <Car className="h-4 w-4 mr-1" />
                    Parking
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, adaCompliant: !prev.adaCompliant }))}
                    className={`${filters.adaCompliant ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'} hover:bg-primary/90`}
                  >
                    <Accessibility className="h-4 w-4 mr-1" />
                    ADA
                  </Button>

                  {(searchQuery || filters.type !== 'all' || filters.minPrice || filters.maxPrice || filters.hasLighting || filters.hasParking || filters.adaCompliant) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {/* Search Results Summary */}
              {(searchQuery || filters.type !== 'all' || filters.minPrice || filters.maxPrice || filters.hasLighting || filters.hasParking || filters.adaCompliant) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {filteredFields.length} of {fields.length} fields match your search
                    </span>
                    {filteredFields.length === 0 && (
                      <span className="text-sm text-amber-400">
                        Try adjusting your filters to see more results
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer-Facing Map View */}
          <Card className="bg-card/50 border-border">
            <CardContent className="p-0">
              <div className="h-[600px] rounded-lg overflow-hidden">
                {filteredFields.length > 0 ? (
                  <MapboxMap 
                    fields={filteredFields}
                    onFieldClick={handleFieldClick}
                    onFieldDoubleClick={handleFieldDoubleClick}
                  />
                ) : (
                  <div className="w-full h-full bg-background flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No Fields to Display</h3>
                      <p className="text-sm">
                        {fields.length === 0 
                          ? "Add your first field to see it on the customer map" 
                          : "Adjust your search filters to see fields on the customer map"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Experience Guidance */}
          {fields.length > 0 && (
            <Card className="bg-blue-900/20 border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-6 text-sm text-blue-300">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>This is exactly what customers see</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Click field for quick info popup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Double-click opens booking modal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters help customers find fields</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reservations" className="space-y-6">
          <ReservationsView facilityId={facilityId} fields={fields} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <FieldCalendarView facilityId={facilityId} fields={fields} reservations={[]} />
        </TabsContent>
      </Tabs>

      {/* Field Detail Modal */}
      <FieldDetailModal
        field={selectedField}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedField(null);
        }}
        onReserveField={handleBookField}
      />

      {/* Full-Screen Facility Rental Modal */}
      <FacilityRentalModal
        item={selectedField}
        itemType="field"
        isOpen={isRentalModalOpen}
        onClose={() => {
          setIsRentalModalOpen(false);
          setSelectedField(null);
        }}
        facilityName="Test Facility" // TODO: Get from facility data
        onReserve={handleReserveItem}
      />

      {/* Edit Field Modal */}
      {editingField && (
        <EditFieldModal
          field={editingField}
          isOpen={!!editingField}
          onClose={() => setEditingField(null)}
          onUpdate={handleFieldUpdate}
        />
      )}

      {/* Staff Assignment Modal */}
      {assigningStaffField && (
        <AssignStaffToFieldModal
          isOpen={isStaffAssignModalOpen}
          onClose={() => {
            setIsStaffAssignModalOpen(false);
            setAssigningStaffField(null);
          }}
          fieldId={assigningStaffField.id}
          fieldName={assigningStaffField.name}
          facilityName="Unknown Facility"
          onAssignmentChange={() => {
            // Reload fields when assignments change
            loadFields();
          }}
        />
      )}
    </div>
  );
}    