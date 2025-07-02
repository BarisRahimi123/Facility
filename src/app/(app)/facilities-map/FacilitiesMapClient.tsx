'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, Building, MapPin, Users, Calendar, X, Star, Eye, Heart } from 'lucide-react';
import type { Field } from '@/types/field';
import type { Room } from '@/types/building';
import { FacilityRentalModal } from '@/components/facility/FacilityRentalModal';

// Dynamically import the map component to avoid SSR issues
const FacilitiesMap = dynamic(
  () => import('@/components/mapbox/FacilitiesMap').then((mod) => ({ default: mod.FacilitiesMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-card rounded-lg flex items-center justify-center border border-border">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading map...</p>
        </div>
      </div>
    )
  }
);

interface Facility {
  id: string;
  name: string;
  address: string;
  facility_type: string;
  status: string;
  square_footage?: number;
  year_built?: number;
}

interface FacilitiesMapClientProps {
  facilities: Facility[];
  fields?: Field[];
}

export function FacilitiesMapClient({ facilities, fields = [] }: FacilitiesMapClientProps) {
  const router = useRouter();
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [hoveredFacility, setHoveredFacility] = useState<Facility | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);

  // Debug logging
  console.log('🔍 FacilitiesMapClient received:', {
    facilitiesCount: facilities.length,
    fieldsCount: fields.length,
    facilities: facilities.map(f => ({ name: f.name, type: f.facility_type })),
    fields: fields.map(f => ({ 
      name: f.name, 
      type: f.type,
      hasImage: !!f.image_url, 
      imageUrl: f.image_url 
    }))
  });
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    minSize: '',
    maxSize: '',
    yearBuilt: 'all'
  });

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    // Navigate to facility detail page
    router.push(`/facility/${facility.id}`);
  };

  // Field interaction handlers
  const handleFieldClick = (field: Field) => {
    console.log('Field clicked:', field.name);
    // Single click just shows hover info - no modal
  };

  const handleFieldDoubleClick = (field: Field) => {
    console.log('Field double-clicked:', field.name);
    setSelectedField(field);
    setIsRentalModalOpen(true);
  };

  const handleReserveField = (item: Field | Room, reservationData: any) => {
    console.log('Reserve item:', item, reservationData);
    // Handle the reservation logic here
    setIsRentalModalOpen(false);
    setSelectedField(null);
  };



  // Combine facilities and fields into unified items for grid display
  const allItems = useMemo(() => {
    const facilityItems = facilities.map(facility => ({
      ...facility,
      itemType: 'facility' as const,
      displayType: facility.facility_type,
      location: facility.address
    }));

    const fieldItems = fields.map(field => ({
      ...field,
      itemType: 'field' as const,
      displayType: field.type,
      location: field.full_address || field.street_address || `${field.latitude}, ${field.longitude}`,
      status: field.status || 'available'
    }));

    return [...facilityItems, ...fieldItems];
  }, [facilities, fields]);

  // Filter combined items based on search and filters
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.displayType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filters.type === 'all' || item.displayType === filters.type;
      const matchesStatus = filters.status === 'all' || item.status === filters.status;
      
      // For size filtering, use square_footage for facilities and capacity for fields
      const itemSize = item.itemType === 'facility' ? item.square_footage : (item as any).capacity;
      const matchesSize = (!filters.minSize || (itemSize && itemSize >= parseInt(filters.minSize))) &&
                         (!filters.maxSize || (itemSize && itemSize <= parseInt(filters.maxSize)));
      
      const itemYear = item.itemType === 'facility' ? (item as any).year_built : new Date().getFullYear();
      const matchesYear = filters.yearBuilt === 'all' || 
                         (filters.yearBuilt === 'recent' && itemYear && itemYear >= 2010) ||
                         (filters.yearBuilt === 'older' && itemYear && itemYear < 2010);
      
      return matchesSearch && matchesType && matchesStatus && matchesSize && matchesYear;
    });
  }, [allItems, searchQuery, filters]);

  // Keep filtered facilities for map (map component expects facilities)
  const filteredFacilities = useMemo(() => {
    return filteredItems.filter(item => item.itemType === 'facility') as Facility[];
  }, [filteredItems]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      type: 'all',
      status: 'all',
      minSize: '',
      maxSize: '',
      yearBuilt: 'all'
    });
  };

  const hasActiveFilters = searchQuery || 
    filters.type !== 'all' || 
    filters.status !== 'all' || 
    filters.minSize || 
    filters.maxSize || 
    filters.yearBuilt !== 'all';

  // Get unique types for filter dropdown (both facilities and fields)
  const allTypes = Array.from(new Set([
    ...facilities.map(f => f.facility_type),
    ...fields.map(f => f.type)
  ]));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Header - Search and Filters */}
      <div className="flex-none px-6 py-4 border-b border-border bg-background">
        <div className="space-y-4">
          {/* Title and Search Row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground">Facilities & Fields</h1>
              <p className="text-muted-foreground text-sm">
                {filteredFacilities.length} facilities • {filteredItems.filter(item => item.itemType === 'field').length} fields
              </p>
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search facilities and fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Filter:</span>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-40 bg-background border-border text-foreground">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg">
                <SelectItem value="all" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">All Types</SelectItem>
                {allTypes.map((type: string) => (
                  <SelectItem key={type} value={type} className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground capitalize">
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-40 bg-background border-border text-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg">
                <SelectItem value="all" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">All Status</SelectItem>
                <SelectItem value="active" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">Active</SelectItem>
                <SelectItem value="inactive" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">Inactive</SelectItem>
                <SelectItem value="maintenance" className="text-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">Maintenance</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            <div className="flex-1" />

            {/* Results Count */}
            <span className="text-sm text-muted-foreground">
              {filteredItems.length} of {allItems.length} items
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Grid View */}
        <div className="w-1/2 flex flex-col bg-background border-r border-border">

          {/* Facilities & Fields Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={`group cursor-pointer overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-card ${
                    hoveredFacility?.id === item.id ? 'shadow-xl shadow-primary/20' : ''
                  }`}
                  onClick={() => {
                    if (item.itemType === 'facility') {
                      handleFacilityClick(item as Facility);
                    } else {
                      // For fields, open the rental modal
                      console.log('Field card clicked:', item.name);
                      setSelectedField(item as Field);
                      setIsRentalModalOpen(true);
                    }
                  }}
                  onMouseEnter={() => item.itemType === 'facility' ? setHoveredFacility(item as Facility) : null}
                  onMouseLeave={() => setHoveredFacility(null)}
                >
                  <div className="relative">
                    {/* Image Section */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                      {item.itemType === 'field' && (item as any).image_url ? (
                        <img 
                          src={(item as any).image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full ${
                          item.itemType === 'facility' 
                            ? 'bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600'
                            : 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600'
                        } group-hover:scale-105 transition-transform duration-300`}>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {item.itemType === 'facility' ? (
                              <Building className="h-16 w-16 text-white/70" />
                            ) : (
                              <div className="text-4xl">🏟️</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Heart Icon - Top Right */}
                      <button 
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement favorite functionality
                        }}
                      >
                        <Heart className="h-4 w-4 text-white fill-transparent hover:fill-white transition-colors" />
                      </button>

                      {/* Status Badge - Top Left */}
                      <div className="absolute top-3 left-3">
                        <Badge 
                          className={`text-xs font-medium border-0 ${
                            item.status === 'active' || item.status === 'available'
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-500 text-white'
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>

                      {/* Rating - Bottom of Image */}
                      <div className="absolute bottom-3 left-3">
                        <div className="flex items-center bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                          <span className="text-white text-xs font-medium">4.8</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-4">
                      {/* Location and Type */}
                      <div className="mb-2">
                        <h3 className="font-semibold text-card-foreground text-sm leading-tight mb-1 truncate">
                          {item.name}
                        </h3>
                        <p className="text-muted-foreground text-xs capitalize mb-1">
                          {item.displayType.replace('_', ' ')} • {item.itemType}
                        </p>
                      </div>

                      {/* Details */}
                      <div className="mb-3">
                        <div className="flex items-center text-muted-foreground text-xs mb-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {item.itemType === 'facility' ? (
                            <span>{(item as any).square_footage?.toLocaleString() || 'N/A'} sq ft • Built {(item as any).year_built || 'N/A'}</span>
                          ) : (
                            <span>{(item as any).capacity ? `${(item as any).capacity} people` : 'N/A capacity'} • {(item as any).surface_type?.replace('_', ' ') || 'Standard'}</span>
                          )}
                        </div>
                      </div>

                      {/* Price Section */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline">
                          {item.itemType === 'facility' ? (
                            <>
                              <span className="text-card-foreground font-bold text-sm">
                                ${Math.round(((item as any).square_footage || 0) / 100)}
                              </span>
                              <span className="text-muted-foreground text-xs ml-1">/ sq ft</span>
                            </>
                          ) : (
                            <>
                              <span className="text-card-foreground font-bold text-sm">
                                ${(item as any).hourly_rate || 0}
                              </span>
                              <span className="text-muted-foreground text-xs ml-1">/ hour</span>
                            </>
                          )}
                        </div>
                        
                        {item.itemType === 'field' && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-1 text-xs rounded-md shadow-lg hover:shadow-xl transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Reserve button clicked for field:', item.name);
                              setSelectedField(item as Field);
                              setIsRentalModalOpen(true);
                            }}
                          >
                            Reserve
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}

              {filteredItems.length === 0 && (
                <div className="text-center py-12 col-span-3">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No facilities or fields found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Map View */}
        <div className="w-1/2 relative flex-1">
          <FacilitiesMap 
            facilities={filteredFacilities}
            fields={fields}
            onFacilityClick={handleFacilityClick}
            onFieldClick={handleFieldClick}
            onFieldDoubleClick={handleFieldDoubleClick}
          />
        </div>
      </div>

      {/* Facility Rental Modal */}
      <FacilityRentalModal
        item={selectedField}
        itemType="field"
        isOpen={isRentalModalOpen}
        onClose={() => {
          setIsRentalModalOpen(false);
          setSelectedField(null);
        }}
        facilityName="Facility" // TODO: Get actual facility name
        onReserve={handleReserveField}
      />
    </div>
  );
} 