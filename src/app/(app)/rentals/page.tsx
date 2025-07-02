'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  DollarSign,
  Clock,
  Filter,
  Grid,
  List,
  Building2,
  TreePine,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { getAllFacilities } from '@/app/actions/facilities';
import { getAllFieldsForMap } from '@/app/actions/fields';
import { getRateCategories } from '@/app/actions/reservations';
import type { Facility } from '@/types/facility';
import type { Field } from '@/types/field';
import type { RateCategory } from '@/types/reservation';

// Dynamic import for map component with error handling
const FacilitiesMap = dynamic(
  () => import('@/components/mapbox/FacilitiesMap')
    .then(mod => ({ default: mod.FacilitiesMap }))
    .catch(() => ({ default: () => (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Map unavailable</p>
        </div>
      </div>
    )})),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-280px)] rounded-lg overflow-hidden border border-border bg-muted/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
);

export default function RentalsMarketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedFacilityType, setSelectedFacilityType] = useState<string>('all');
  const [selectedSpaceType, setSelectedSpaceType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [capacity, setCapacity] = useState([0, 1000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [rateCategories, setRateCategories] = useState<RateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const [facilitiesData, fieldsData, ratesData] = await Promise.all([
        getAllFacilities(),
        getAllFieldsForMap(),
        getRateCategories()
      ]);

      setFacilities(facilitiesData || []);
      setFields(fieldsData || []);
      setRateCategories(ratesData?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load rental data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter facilities based on search criteria
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedFacilityType === 'all' || facility.facility_type === selectedFacilityType;
    
    return matchesSearch && matchesType && facility.status === 'active';
  });

  // Get fields for filtered facilities
  const availableFields = fields.filter(field => {
    const facility = filteredFacilities.find(f => f.id === field.facility_id);
    if (!facility) return false;
    
    const matchesSpaceType = selectedSpaceType === 'all' || field.type === selectedSpaceType;
    const matchesPrice = field.hourly_rate >= priceRange[0] && field.hourly_rate <= priceRange[1];
    const matchesCapacity = !field.capacity || (field.capacity >= capacity[0] && field.capacity <= capacity[1]);
    
    return matchesSpaceType && matchesPrice && matchesCapacity && field.status === 'available';
  });

  const FacilityCard = ({ facility, facilityFields }: { facility: Facility; facilityFields: Field[] }) => (
    <Card className="bg-card hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {facility.name}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-sm">{facility.address}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {facility.facility_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Available Spaces:</span>
          <span className="font-medium text-foreground">{facilityFields.length}</span>
        </div>
        
        {facilityFields.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Starting from:</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-lg font-semibold text-foreground">
                  ${Math.min(...facilityFields.map(f => f.hourly_rate))}/hr
                </span>
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = `/rentals/facility/${facility.id}`}
              >
                View Spaces
              </Button>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {facilityFields.slice(0, 3).map(field => (
              <Badge key={field.id} variant="secondary" className="text-xs">
                {field.name}
              </Badge>
            ))}
            {facilityFields.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{facilityFields.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find & Reserve Facilities
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Discover and book the perfect space for your event, activity, or program. 
            From sports fields to meeting rooms, we have spaces for every need.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by facility name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-input text-foreground"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <div className="flex rounded-lg border border-border overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none h-12 w-12"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none border-x border-border h-12 w-12"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-none h-12 w-12"
                  onClick={() => setViewMode('map')}
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:w-72 space-y-4">
              <Card className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selection - Input Style */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      <CalendarIcon className="h-4 w-4 inline mr-1" />
                      Select Date
                    </Label>
                    <Input
                      type="date"
                      value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="bg-input h-9"
                    />
                  </div>

                  {/* Facility Type */}
                  <div>
                    <Label htmlFor="facility-type" className="text-sm font-medium">Facility Type</Label>
                    <Select value={selectedFacilityType} onValueChange={setSelectedFacilityType}>
                      <SelectTrigger id="facility-type" className="bg-input h-9 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="park">Park</SelectItem>
                        <SelectItem value="community_center">Community Center</SelectItem>
                        <SelectItem value="sports_complex">Sports Complex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Space Type */}
                  <div>
                    <Label htmlFor="space-type" className="text-sm font-medium">Space Type</Label>
                    <Select value={selectedSpaceType} onValueChange={setSelectedSpaceType}>
                      <SelectTrigger id="space-type" className="bg-input h-9 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Spaces</SelectItem>
                        <SelectItem value="Soccer Field">Soccer Field</SelectItem>
                        <SelectItem value="Baseball Field">Baseball Field</SelectItem>
                        <SelectItem value="Basketball Court">Basketball Court</SelectItem>
                        <SelectItem value="Tennis Court">Tennis Court</SelectItem>
                        <SelectItem value="Multi-Purpose Field">Multi-Purpose Field</SelectItem>
                        <SelectItem value="Classroom">Classroom</SelectItem>
                        <SelectItem value="Gymnasium">Gymnasium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Price Range (per hour)
                    </Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={500}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}+</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <Label className="text-sm font-medium">
                      <Users className="h-4 w-4 inline mr-1" />
                      Capacity
                    </Label>
                    <div className="mt-2 space-y-2">
                      <Slider
                        value={capacity}
                        onValueChange={setCapacity}
                        max={1000}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{capacity[0]} people</span>
                        <span>{capacity[1]}+ people</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full h-8"
                    onClick={() => {
                      setSelectedFacilityType('all');
                      setSelectedSpaceType('all');
                      setPriceRange([0, 500]);
                      setCapacity([0, 1000]);
                    }}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats - More Compact */}
              <Card className="bg-card/50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Available Facilities</span>
                      <Badge variant="secondary" className="text-xs">{filteredFacilities.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total Spaces</span>
                      <Badge variant="secondary" className="text-xs">{availableFields.length}</Badge>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between items-center pt-1 border-t border-border">
                        <span className="text-xs text-muted-foreground">Selected Date</span>
                        <span className="text-xs font-medium text-foreground">
                          {format(selectedDate, 'MMM d')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Results Section */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <Card className="bg-card/50">
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Error Loading Rentals
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error}
                  </p>
                  <Button onClick={loadData} variant="outline">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'map' ? (
              <div className="h-[calc(100vh-280px)] rounded-lg overflow-hidden border border-border">
                <FacilitiesMap facilities={facilities} fields={fields} />
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredFacilities.map(facility => {
                  const facilityFields = availableFields.filter(f => f.facility_id === facility.id);
                  if (facilityFields.length === 0) return null;
                  
                  return (
                    <FacilityCard
                      key={facility.id}
                      facility={facility}
                      facilityFields={facilityFields}
                    />
                  );
                })}
              </div>
            )}

            {!loading && filteredFacilities.length === 0 && (
              <Card className="bg-card/50">
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No facilities found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search criteria
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 