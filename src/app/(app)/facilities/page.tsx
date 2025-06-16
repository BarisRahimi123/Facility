'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Facility } from '@/types/facility';
import toast from 'react-hot-toast';
import { getAllFacilities } from '@/app/actions/facilities';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFacilities() {
      try {
        const data = await getAllFacilities();
        setFacilities(data);
      } catch (error) {
        console.error('Error loading facilities:', error);
        toast.error('Failed to load facilities');
      } finally {
        setIsLoading(false);
      }
    }

    loadFacilities();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 bg-black min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Facilities</h1>
          <p className="text-gray-400 mt-2">Manage your facilities and their resources</p>
        </div>
        <Link href="/facilities/new">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3">
            <Plus className="h-4 w-4" />
            Add Facility
          </Button>
        </Link>
      </div>

      {facilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Link key={facility.id} href={`/facility/${facility.id}`}>
              <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:shadow-purple-500/10">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl text-white group-hover:text-purple-300 transition-colors">{facility.name}</CardTitle>
                    <Badge 
                      variant={facility.status === 'active' ? 'default' : 'secondary'}
                      className={facility.status === 'active' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 text-gray-300'
                      }
                    >
                      {facility.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-400">
                      <Building2 className="h-4 w-4 mr-3 text-purple-400" />
                      <span>{facility.facility_type}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <MapPin className="h-4 w-4 mr-3 text-purple-400" />
                      <span>{facility.address}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800">
                      <div className="flex items-center text-sm text-gray-300">
                        <Users className="h-4 w-4 mr-2 text-blue-400" />
                        <span>{facility.occupancy_rate || 0}% Occupied</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-400" />
                        <span>{facility.active_issues || 0} Issues</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 bg-gray-900/50 border-gray-800">
          <CardContent>
            <Building2 className="h-16 w-16 mx-auto text-gray-600 mb-6" />
            <h3 className="text-xl font-semibold text-white mb-3">No facilities found</h3>
            <p className="text-gray-400 mb-6">Get started by adding your first facility.</p>
            <Link href="/facilities/new">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 rounded-xl px-6 py-3">
                Add Facility
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 