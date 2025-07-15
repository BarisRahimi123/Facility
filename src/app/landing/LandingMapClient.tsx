'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  Building, 
  MapPin, 
  Users, 
  Calendar, 
  X, 
  Star, 
  Heart,
  SlidersHorizontal,
  LayoutGrid,
  Map,
  Home,
  User,
  Menu,
  Bell,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Ban,
  Loader2
} from 'lucide-react';
import type { Field } from '@/types/field';
import type { Room } from '@/types/building';
import type { Facility } from '@/types/facility';
import { FacilityRentalModal } from '@/components/facility/FacilityRentalModal';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';

// Dynamically import the map component to avoid SSR issues
const FacilitiesMap = dynamic(
  () => import('@/components/mapbox/FacilitiesMap').then((mod) => ({ default: mod.FacilitiesMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Interactive Map</h3>
          <p className="text-gray-600 dark:text-gray-400">Preparing your facility search experience...</p>
        </div>
      </div>
    )
  }
);

type MapItem = (Facility | Field) & { itemType: 'facility' | 'field' };

export function LandingMapClient() {
  const router = useRouter();
  
  // Data state
  const [items, setItems] = useState<MapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal and view state
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [hoveredFacility, setHoveredFacility] = useState<Facility | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priceRange: [0, 1000],
    capacity: [0, 500],
    yearBuilt: 'all',
    amenities: [] as string[]
  });
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Data fetching function
  const fetchItems = useCallback(async (pageNum = 1, shouldAppend = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        search: debouncedSearchQuery,
        type: filters.type,
        priceMin: filters.priceRange[0].toString(),
        priceMax: filters.priceRange[1].toString(),
        capacityMin: filters.capacity[0].toString(),
        capacityMax: filters.capacity[1].toString(),
      });
      
      const response = await fetch(`/api/landing-search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      
      // Add itemType to each item for differentiation
      const typedItems = data.items.map((item: Facility | Field) => ({
        ...item,
        itemType: 'hourly_rate' in item ? 'field' : 'facility'
      }));

      if (shouldAppend) {
        setItems(prev => [...prev, ...typedItems]);
      } else {
        setItems(typedItems);
      }
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchQuery, filters]);

  // Initial data fetch and refetch on filter change
  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchItems(page + 1, true);
    }
  };

  const handleFacilityClick = (facility: Facility) => {
    setSelectedFacility(facility);
    router.push(`/facility/${facility.id}`);
  };

  const handleFieldClick = (field: Field) => {
    console.log('Field clicked:', field.name);
  };

  const handleFieldDoubleClick = (field: Field) => {
    console.log('Field double-clicked:', field.name);
    setSelectedField(field);
    setIsRentalModalOpen(true);
  };

  const handleReserveField = (item: Field | Room, reservationData: any) => {
    console.log('Reserve item:', item, reservationData);
    setIsRentalModalOpen(false);
    setSelectedField(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({
      type: 'all',
      status: 'all',
      priceRange: [0, 1000],
      capacity: [0, 500],
      yearBuilt: 'all',
      amenities: []
    });
  };

  const hasActiveFilters = searchQuery || 
    filters.type !== 'all' || 
    filters.status !== 'all' || 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 1000 ||
    filters.capacity[0] > 0 || 
    filters.capacity[1] < 500 ||
    filters.yearBuilt !== 'all' ||
    filters.amenities.length > 0;

  // Get unique types for filter dropdown
  const allTypes = useMemo(() => {
    // This could be fetched from the backend in a real app
    return ['facility', 'field', 'soccer', 'football', 'basketball', 'tennis'];
  }, []);

  const amenitiesList = ['WiFi', 'Parking', 'Restrooms', 'Kitchen', 'ADA Accessible', 'Climate Control', 'Sound System', 'Projector'];

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="h-3 w-3" />;
      case 'parking': return <Car className="h-3 w-3" />;
      case 'kitchen': return <Utensils className="h-3 w-3" />;
      case 'restrooms': return <Home className="h-3 w-3" />;
      default: return <Coffee className="h-3 w-3" />;
    }
  };

  const facilities = items.filter(item => item.itemType === 'facility') as (Facility & {itemType: 'facility'})[];
  const fields = items.filter(item => item.itemType === 'field') as (Field & {itemType: 'field'})[];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation Bar - Airbnb Style */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                FacilityCore
              </h1>
            </Link>

            {/* Search Bar - Airbnb Style */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <div className="flex-1 px-6 py-3">
                    <div className="flex items-center">
                      <Search className="h-4 w-4 text-gray-400 mr-3" />
                      <input
                        type="text"
                        placeholder="Search facilities, fields, locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 bg-transparent border-0 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="px-2">
                    <button className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow">
                      <Search className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* View Toggle - Airbnb Style */}
              <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    viewMode === 'map'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Map className="h-4 w-4" />
                  Map
                </button>
              </div>

              {/* Filters Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`gap-2 rounded-full border-gray-300 dark:border-gray-600 hover:shadow-md transition-shadow ${
                      hasActiveFilters ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300' : ''
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl rounded-3xl" align="end">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearFilters}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                      <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                          <SelectItem value="all">All Types</SelectItem>
                          {allTypes.map((type: string) => (
                            <SelectItem key={type} value={type} className="capitalize">
                              {type.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Price Range
                      </label>
                      <div className="px-3">
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value }))}
                          max={1000}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                          <span>${filters.priceRange[0]}</span>
                          <span>${filters.priceRange[1]}+</span>
                        </div>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Capacity
                      </label>
                      <div className="px-3">
                        <Slider
                          value={filters.capacity}
                          onValueChange={(value) => setFilters(prev => ({ ...prev, capacity: value }))}
                          max={500}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-2">
                          <span>{filters.capacity[0]} people</span>
                          <span>{filters.capacity[1]}+ people</span>
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amenities</label>
                      <div className="grid grid-cols-2 gap-3">
                        {amenitiesList.map((amenity) => (
                          <button
                            key={amenity}
                            onClick={() => {
                              const newAmenities = filters.amenities.includes(amenity)
                                ? filters.amenities.filter(a => a !== amenity)
                                : [...filters.amenities, amenity];
                              setFilters(prev => ({ ...prev, amenities: newAmenities }));
                            }}
                            className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border transition-all ${
                              filters.amenities.includes(amenity)
                                ? 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* User Menu */}
              <Link href="/auth/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all">
                  Try For Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg">
              <div className="flex items-center px-4 py-3">
                <Search className="h-4 w-4 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search facilities and fields..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 bg-transparent border-0 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {viewMode === 'grid' ? (
          /* Grid View - Airbnb Style */
          <div className="py-8">
            {/* Results Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {totalCount > 0 ? (
                  <>
                    {totalCount} {totalCount === 1 ? 'space' : 'spaces'} found
                  </>
                ) : (
                  'No spaces available'
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover unique facilities and fields for your next event
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 rounded-3xl"
                  onClick={() => {
                    if (item.itemType === 'facility') {
                      handleFacilityClick(item as Facility);
                    } else {
                      setSelectedField(item as Field);
                      setIsRentalModalOpen(true);
                    }
                  }}
                >
                  {/* Image Section - Airbnb Style */}
                  <div className="relative aspect-square overflow-hidden">
                    {(item as Field).image_url ? (
                      <img 
                        src={(item as Field).image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className={`w-full h-full ${
                        item.itemType === 'facility' 
                          ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
                          : 'bg-gradient-to-br from-green-400 via-green-500 to-green-600'
                      } group-hover:scale-105 transition-transform duration-700`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.itemType === 'facility' ? (
                            <Building className="h-20 w-20 text-white/70" />
                          ) : (
                            <div className="text-6xl">🏟️</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Heart Icon - Airbnb Style */}
                    <button 
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement favorite functionality
                      }}
                    >
                      <Heart className="h-4 w-4 text-white" />
                    </button>
                    
                    {/* Blockout Indicator for Fields */}
                    {item.itemType === 'field' && (item as any).isBlockedOut && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Ban className="h-3 w-3" />
                        Blocked Out
                      </div>
                    )}
                  </div>

                  {/* Content - Airbnb Style */}
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {item.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs capitalize">
                          {'hourly_rate' in item ? item.type.replace('_', ' ') : (item as Facility).facility_type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          4.8
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-xs mb-3">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{'address' in item ? item.address : (item as Field).full_address}</span>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-xs mb-3">
                      <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span>{'capacity' in item ? item.capacity : 'N/A'} people capacity</span>
                    </div>

                    {/* Price - Airbnb Style */}
                    <div className="flex items-baseline">
                      <span className={`text-lg font-semibold text-gray-900 dark:text-white`}>
                        ${'hourly_rate' in item ? item.hourly_rate : ((item as Facility).square_footage || 0) / 100}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">
                        / {'hourly_rate' in item ? 'hour' : 'sq ft'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {page < totalPages && (
              <div className="text-center mt-8">
                <Button 
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full px-8 py-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Spaces'
                  )}
                </Button>
              </div>
            )}

            {/* Empty State - Airbnb Style */}
            {items.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No spaces match your search
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Try adjusting your search or filters to find the perfect space for your needs.
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-8"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Map View */
          <div className="h-screen">
            <div className="relative h-full">
              <FacilitiesMap 
                facilities={facilities}
                fields={fields}
                onFacilityClick={handleFacilityClick}
                onFieldClick={handleFieldClick}
                onFieldDoubleClick={handleFieldDoubleClick}
              />
              
              {/* Floating Results Counter */}
              <div className="absolute top-6 left-6 z-10">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {totalCount} spaces found
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Facility Rental Modal */}
      <FacilityRentalModal
        item={selectedField}
        itemType="field"
        isOpen={isRentalModalOpen}
        onClose={() => {
          setIsRentalModalOpen(false);
          setSelectedField(null);
        }}
        facilityName="Facility"
        onReserve={handleReserveField}
        fieldBlockouts={[]}
      />
    </div>
  );
} 