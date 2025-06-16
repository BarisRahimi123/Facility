'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBuilding } from '@/app/actions/buildings';
import { BuildingTypes } from '@/types/building';
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

  if (!params?.facilityId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Invalid Facility URL</h2>
          <p className="mt-2 text-gray-600">The URL you're trying to access is invalid.</p>
          <Link href="/facilities">
            <Button variant="outline" className="mt-4">
              Return to Facilities
            </Button>
          </Link>
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
      formData.append('facilityId', facilityId);
      
      // Call the server action
      await createBuilding(formData);
      
      toast.dismiss(loadingToast);
      toast.success('Building created successfully');

      // Redirect back to facility page
      router.push(`/facility/${facilityId}`);
    } catch (error) {
      console.error('Error creating building:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to create building. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/facilities" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <Home className="w-4 h-4 mr-2" />
              Facilities
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link 
                href={`/facility/${facilityId}`}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
              >
                Facility
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link 
                href={`/facility/${facilityId}/buildings`}
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
              >
                Buildings
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                New Building
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Building</h1>
        <p className="text-gray-600 mt-1">Create a new building in this facility</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Building Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Building Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter building name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingNumber">Building Number</Label>
                <Input
                  id="buildingNumber"
                  name="buildingNumber"
                  placeholder="Enter building number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select name="buildingType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BuildingTypes).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constructionDate">Construction Date</Label>
                <Input
                  id="constructionDate"
                  name="constructionDate"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  name="squareFootage"
                  type="number"
                  min="0"
                  placeholder="Enter square footage"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                <Input
                  id="numberOfRooms"
                  name="numberOfRooms"
                  type="number"
                  min="0"
                  placeholder="Enter number of rooms"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Enter any additional notes about the building"
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Building'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 