'use client';

import { createFacility } from '@/app/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewFacilityPage() {
  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Create New Facility</h1>
      
      <form action={createFacility} className="space-y-6">
        <div className="space-y-4">
          {/* Facility Name */}
          <div>
            <Label htmlFor="name">Facility Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Main Campus or Elementary School Building A"
              required
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="Full street address"
              required
            />
          </div>

          {/* Facility Type */}
          <div>
            <Label htmlFor="facilityType">Facility Type</Label>
            <select
              id="facilityType"
              name="facilityType"
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              required
            >
              <option value="">Select a facility type</option>
              <option value="Elementary School">Elementary School</option>
              <option value="Middle School">Middle School</option>
              <option value="High School">High School</option>
              <option value="Admin Building">Admin Building</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Total Square Footage */}
          <div>
            <Label htmlFor="totalSquareFootage">Total Square Footage</Label>
            <Input
              id="totalSquareFootage"
              name="totalSquareFootage"
              type="number"
              min="0"
              placeholder="Enter total square feet"
              required
            />
          </div>

          {/* Number of Floors */}
          <div>
            <Label htmlFor="numberOfFloors">Number of Floors</Label>
            <Input
              id="numberOfFloors"
              name="numberOfFloors"
              type="number"
              min="1"
              placeholder="Enter number of floors"
              required
            />
          </div>

          {/* Year Built */}
          <div>
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              name="yearBuilt"
              type="date"
              required
            />
          </div>

          {/* Last Renovation Date */}
          <div>
            <Label htmlFor="lastRenovationDate">Last Renovation Date (Optional)</Label>
            <Input
              id="lastRenovationDate"
              name="lastRenovationDate"
              type="date"
            />
          </div>

          {/* Facility Condition Index */}
          <div>
            <Label htmlFor="facilityConditionIndex">
              Facility Condition Index (FCI)
              <span className="text-sm text-gray-500 block">
                Assessment rating for overall facility condition (0-100)
              </span>
            </Label>
            <Input
              id="facilityConditionIndex"
              name="facilityConditionIndex"
              type="number"
              min="0"
              max="100"
              placeholder="Enter FCI score (0-100)"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" variant="primary">
            Create Facility
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 