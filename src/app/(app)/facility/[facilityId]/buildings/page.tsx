'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building } from '@/types/building';
import { BuildingService } from '@/services/building-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function BuildingListPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const facilityId = params?.facilityId;
    if (!facilityId || typeof facilityId !== 'string') {
      toast({
        title: 'Error',
        description: 'Invalid facility URL',
        variant: 'destructive',
      });
      router.push('/facilities');
      return;
    }

    async function loadBuildings() {
      try {
        const data = await BuildingService.getBuildingsByFacilityId(facilityId);
        setBuildings(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load buildings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadBuildings();
  }, [params?.facilityId, router, toast]);

  const handleCreateBuilding = () => {
    const facilityId = params?.facilityId;
    if (!facilityId || typeof facilityId !== 'string') return;
    router.push(`/facility/${facilityId}/buildings/new`);
  };

  const handleBuildingClick = (buildingId: string) => {
    const facilityId = params?.facilityId;
    if (!facilityId || typeof facilityId !== 'string') return;
    router.push(`/facility/${facilityId}/buildings/${buildingId}`);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      maintenance: 'bg-yellow-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Buildings</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Buildings</h1>
        <Button onClick={handleCreateBuilding}>
          <Plus className="mr-2 h-4 w-4" />
          Add Building
        </Button>
      </div>

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900">No buildings found</p>
            <p className="text-sm text-gray-500">Get started by adding a new building</p>
            <Button onClick={handleCreateBuilding} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Building
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((building) => (
            <Card
              key={building.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleBuildingClick(building.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{building.name}</CardTitle>
                    <p className="text-sm text-gray-500">#{building.building_number}</p>
                  </div>
                  <Badge className={getStatusColor(building.status)}>
                    {building.status.charAt(0).toUpperCase() + building.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-medium">{building.building_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Square Footage</span>
                    <span className="text-sm font-medium">
                      {building.square_footage.toLocaleString()} sq ft
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Construction Date</span>
                    <span className="text-sm font-medium">
                      {building.construction_date ? format(parseISO(building.construction_date), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 