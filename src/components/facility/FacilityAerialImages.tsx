'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Plus } from 'lucide-react';

interface FacilityAerialImagesProps {
  facilityId: string;
}

export function FacilityAerialImages({ facilityId }: FacilityAerialImagesProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white">Maps & Aerial Images</h2>
          <p className="text-gray-400 mt-1">Drone photos, mosaics, and aerial mapping data</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3">
          <Plus className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      </div>

              <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="py-16 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-white">No aerial images yet</h3>
            <p className="mt-2 text-gray-400">Upload drone photos, mosaics, and aerial maps to get started.</p>
            <Button className="mt-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3">
              <Plus className="h-4 w-4 mr-2" />
              Upload First Image
            </Button>
          </CardContent>
        </Card>
    </div>
  );
} 