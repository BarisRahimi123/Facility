'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBuilding } from '@/app/actions/buildings';
import { getFacilityById } from '@/app/actions/facilities';
import { BuildingTypes } from '@/types/building';
import { Facility } from '@/types/facility';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function NewBuildingPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoadingFacility, setIsLoadingFacility] = useState(true);

  // Fetch facility data to show correct name in breadcrumb
  useEffect(() => {
    async function loadFacility() {
      if (!params?.facilityId) return;
      
      const facilityId = params.facilityId as string;
      
      try {
        setIsLoadingFacility(true);
        const facilityData = await getFacilityById(facilityId);
        setFacility(facilityData);
      } catch (error) {
        console.error('Error loading facility:', error);
        toast.error('Failed to load facility information');
      } finally {
        setIsLoadingFacility(false);
      }
    }

    loadFacility();
  }, [params?.facilityId]);

  if (!params?.facilityId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Invalid Facility URL</h2>
            <p className="mt-2 text-gray-400">The URL you're trying to access is invalid.</p>
            <Link href="/facilities">
              <Button variant="outline" className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                Return to Facilities
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const facilityId = params.facilityId as string;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const loadingToast = toast.loading('Creating building...');

    try {
      const formData = new FormData(e.currentTarget);
      
      // Add facility ID to form data
      formData.append('facility_id', facilityId);
      
      // Call the server action
      await createBuilding(formData);
      
      toast.dismiss(loadingToast);
      toast.success('Building created successfully');

      // Use window.location.href for full page reload to ensure buildings are loaded
      window.location.href = `/facility/${facilityId}`;
    } catch (error) {
      console.error('Error creating building:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to create building. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Theme-aware Breadcrumb Navigation */}
        <nav className="flex mb-8 bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/facilities" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors">
                <Home className="w-4 h-4 mr-2" />
                Facilities
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Link 
                  href={`/facility/${facilityId}`}
                  className="ml-1 text-sm font-medium text-foreground hover:text-primary md:ml-2 transition-colors"
                >
                  {isLoadingFacility ? 'Loading...' : (facility?.name || 'Facility')}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <Link 
                  href={`/facility/${facilityId}/buildings`}
                  className="ml-1 text-sm font-medium text-foreground hover:text-primary md:ml-2 transition-colors"
                >
                  Buildings
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="ml-1 text-sm font-medium text-muted-foreground md:ml-2">
                  New Building
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Add New Building</h1>
          <p className="text-muted-foreground mt-2">
            Create a new building in {isLoadingFacility ? 'this facility' : (facility?.name || 'this facility')}
          </p>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-xl font-semibold text-card-foreground">Building Information</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground font-medium">Building Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter building name"
                  required
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingNumber" className="text-card-foreground font-medium">Building Number</Label>
                <Input
                  id="buildingNumber"
                  name="building_number"
                  placeholder="Enter building number"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingType" className="text-card-foreground font-medium">Building Type</Label>
                <Select name="building_type" required>
                  <SelectTrigger className="bg-input border-border text-foreground focus:border-ring focus:ring-ring/20 data-[placeholder]:text-muted-foreground">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {Object.entries(BuildingTypes).map(([key, value]) => (
                      <SelectItem key={key} value={value} className="text-card-foreground hover:bg-accent focus:bg-accent">
                        {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constructionDate" className="text-card-foreground font-medium">Construction Date</Label>
                <Input
                  id="constructionDate"
                  name="construction_date"
                  type="date"
                  required
                  className="bg-input border-border text-foreground focus:border-ring focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dsaNumber" className="text-card-foreground font-medium">DSA Number</Label>
                <Input
                  id="dsaNumber"
                  name="dsa_number"
                  placeholder="Enter DSA number"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFootage" className="text-card-foreground font-medium">Square Footage</Label>
                <Input
                  id="squareFootage"
                  name="square_footage"
                  type="number"
                  min="0"
                  placeholder="Enter square footage"
                  required
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfRooms" className="text-card-foreground font-medium">Number of Rooms</Label>
                <Input
                  id="numberOfRooms"
                  name="number_of_rooms"
                  type="number"
                  min="0"
                  placeholder="Enter number of rooms"
                  required
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-card-foreground font-medium">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Enter any additional notes about the building"
                rows={4}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring/20"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl px-8 py-3"
              >
                {isSubmitting ? 'Creating...' : 'Create Building'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}  