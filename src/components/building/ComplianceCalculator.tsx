'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  Users, 
  Square, 
  AlertCircle,
  Info,
  Settings
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  room_function: string;
  square_footage: number;
  capacity?: number;
  room_number?: string;
}

interface RestroomFixtures {
  toilets: number;
  sinks: number;
  urinals?: number;
}

interface ComplianceCalculatorProps {
  rooms: Room[];
  buildingType: string;
  studentCount?: number;
  staffCount?: number;
  building?: {
    boys_toilets?: number;
    girls_toilets?: number;
    unisex_toilets?: number;
    boys_urinals?: number;
    girls_urinals?: number;
    boys_sinks?: number;
    girls_sinks?: number;
    unisex_sinks?: number;
    boys_restrooms_count?: number;
    girls_restrooms_count?: number;
    unisex_restrooms_count?: number;
    staff_toilets?: number;
    staff_sinks?: number;
    staff_restrooms_count?: number;
  };
  onUpdateCounts?: (students: number, staff: number) => void;
}

interface RoomComplianceResult {
  room: Room;
  isCompliant: boolean;
  requiredSize: number;
  deficit: number;
  grade?: string;
}

interface RestroomRequirements {
  students: {
    girlsToilets: number;
    boysToilets: number;
    totalLavatories: number;
    unisexAlternative: number;
  };
  staff: {
    toilets: number;
  };
  total: {
    minToilets: number;
    minSinks: number;
  };
}

const ROOM_SIZE_REQUIREMENTS = {
  kindergarten: 1350,
  elementary: 960,
  middle: 960,
  high: 960,
  general: 960
};

const OCCUPANCY_RATES = {
  // Square feet per person
  classroom: 25, // Average of 20-30 sq ft per student
  auditorium: 15,
  cafeteria: 15,
  library: 6, // Average of 5-7 sq ft per student
  gymnasium: 15,
  office: 100,
  conference: 15,
  laboratory: 50,
  storage: 300,
  hallway: 100,
  general: 50 // Default for unknown types
};

export default function ComplianceCalculator({
  rooms,
  buildingType,
  studentCount = 0,
  staffCount = 0,
  building,
  onUpdateCounts
}: ComplianceCalculatorProps) {
  const [currentStudentCount, setCurrentStudentCount] = useState(studentCount);
  const [currentStaffCount, setCurrentStaffCount] = useState(staffCount);
  
  // Calculate current restroom fixtures from building data
  const currentRestroomFixtures = {
    toilets: (building?.boys_toilets || 0) + (building?.girls_toilets || 0) + (building?.unisex_toilets || 0) + (building?.staff_toilets || 0),
    sinks: (building?.boys_sinks || 0) + (building?.girls_sinks || 0) + (building?.unisex_sinks || 0) + (building?.staff_sinks || 0),
    urinals: (building?.boys_urinals || 0) + (building?.girls_urinals || 0)
  };
  
  const [activeTab, setActiveTab] = useState('room-size');

  // Calculate room size compliance
  const calculateRoomCompliance = (): RoomComplianceResult[] => {
    const classrooms = rooms.filter(room => 
      room.room_function?.toLowerCase().includes('classroom') ||
      room.room_function?.toLowerCase().includes('kindergarten') ||
      room.room_function?.toLowerCase().includes('grade')
    );

    return classrooms.map(room => {
      let requiredSize = ROOM_SIZE_REQUIREMENTS.general;
      let grade = '';

      // Determine grade level and required size
      const roomName = room.name.toLowerCase();
      const roomFunction = room.room_function?.toLowerCase() || '';

      if (roomFunction.includes('kindergarten') || roomName.includes('kindergarten')) {
        requiredSize = ROOM_SIZE_REQUIREMENTS.kindergarten;
        grade = 'Kindergarten';
      } else if (roomFunction.includes('elementary') || roomName.includes('elementary')) {
        requiredSize = ROOM_SIZE_REQUIREMENTS.elementary;
        grade = 'Elementary';
      } else if (roomFunction.includes('middle') || roomName.includes('middle')) {
        requiredSize = ROOM_SIZE_REQUIREMENTS.middle;
        grade = 'Middle School';
      } else if (roomFunction.includes('high') || roomName.includes('high')) {
        requiredSize = ROOM_SIZE_REQUIREMENTS.high;
        grade = 'High School';
      } else {
        grade = 'General';
      }

      const isCompliant = room.square_footage >= requiredSize;
      const deficit = isCompliant ? 0 : requiredSize - room.square_footage;

      return {
        room,
        isCompliant,
        requiredSize,
        deficit,
        grade
      };
    });
  };

  // Calculate occupancy for rooms
  const calculateRoomOccupancy = () => {
    return rooms.map(room => {
      let roomType = 'general';
      const roomFunction = room.room_function?.toLowerCase() || '';
      const roomName = room.name?.toLowerCase() || '';
      
      // Determine room type based on function and name
      if (roomFunction.includes('classroom') || roomName.includes('classroom')) {
        roomType = 'classroom';
      } else if (roomFunction.includes('auditorium') || roomName.includes('auditorium')) {
        roomType = 'auditorium';
      } else if (roomFunction.includes('cafeteria') || roomFunction.includes('dining') || roomName.includes('cafeteria')) {
        roomType = 'cafeteria';
      } else if (roomFunction.includes('library') || roomName.includes('library')) {
        roomType = 'library';
      } else if (roomFunction.includes('gymnasium') || roomFunction.includes('gym') || roomName.includes('gym')) {
        roomType = 'gymnasium';
      } else if (roomFunction.includes('office') || roomName.includes('office')) {
        roomType = 'office';
      } else if (roomFunction.includes('conference') || roomFunction.includes('meeting') || roomName.includes('conference')) {
        roomType = 'conference';
      } else if (roomFunction.includes('laboratory') || roomFunction.includes('lab') || roomName.includes('lab')) {
        roomType = 'laboratory';
      } else if (roomFunction.includes('storage') || roomName.includes('storage')) {
        roomType = 'storage';
      } else if (roomFunction.includes('hallway') || roomFunction.includes('corridor') || roomName.includes('hallway')) {
        roomType = 'hallway';
      }

      const sqFtPerPerson = OCCUPANCY_RATES[roomType as keyof typeof OCCUPANCY_RATES];
      const maxOccupancy = Math.floor(room.square_footage / sqFtPerPerson);
      const currentOccupancy = room.capacity || 0;
      const utilizationRate = maxOccupancy > 0 ? (currentOccupancy / maxOccupancy * 100) : 0;
      const isOverCapacity = currentOccupancy > maxOccupancy;

      return {
        room,
        roomType,
        sqFtPerPerson,
        maxOccupancy,
        currentOccupancy,
        utilizationRate,
        isOverCapacity
      };
    });
  };

  // Calculate restroom requirements
  const calculateRestroomRequirements = (): RestroomRequirements => {
    const girlsToilets = Math.ceil(currentStudentCount * 0.5 / 25); // Assuming 50/50 gender split
    const boysToilets = Math.ceil(currentStudentCount * 0.5 / 50);
    const totalLavatories = Math.ceil(currentStudentCount / 100);
    const unisexAlternative = Math.ceil(currentStudentCount / 75);
    const staffToilets = Math.ceil(currentStaffCount / 15);

    return {
      students: {
        girlsToilets,
        boysToilets,
        totalLavatories,
        unisexAlternative
      },
      staff: {
        toilets: staffToilets
      },
      total: {
        minToilets: Math.max(girlsToilets + boysToilets + staffToilets, unisexAlternative + staffToilets),
        minSinks: totalLavatories + staffToilets
      }
    };
  };

  const roomCompliance = calculateRoomCompliance();
  const restroomRequirements = calculateRestroomRequirements();
  const occupancyData = calculateRoomOccupancy();
  
  const nonCompliantRooms = roomCompliance.filter(result => !result.isCompliant);
  const overCapacityRooms = occupancyData.filter(data => data.isOverCapacity);
  const restroomCompliant = {
    toilets: currentRestroomFixtures.toilets >= restroomRequirements.total.minToilets,
    sinks: currentRestroomFixtures.sinks >= restroomRequirements.total.minSinks
  };

  const handleCountUpdate = () => {
    onUpdateCounts?.(currentStudentCount, currentStaffCount);
  };

  const overallCompliance = {
    rooms: nonCompliantRooms.length === 0,
    restrooms: restroomCompliant.toilets && restroomCompliant.sinks,
    occupancy: overCapacityRooms.length === 0
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Compliance Calculator
          <div className="flex gap-2 ml-auto">
            {overallCompliance.rooms && overallCompliance.restrooms && overallCompliance.occupancy ? (
              <Badge variant="default" className="bg-green-600 text-white flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                All Compliant
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Issues Found
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Automated compliance checking for room sizes and restroom requirements
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="room-size">
              <Square className="h-4 w-4 mr-2" />
              Room Sizes
            </TabsTrigger>
            <TabsTrigger value="restrooms">
              <Users className="h-4 w-4 mr-2" />
              Restrooms
            </TabsTrigger>
            <TabsTrigger value="occupancy">
              <Calculator className="h-4 w-4 mr-2" />
              Occupancy
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="room-size" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Minimum Room Size Validation</h3>
              <Badge variant="outline">
                {roomCompliance.length} Classrooms Checked
              </Badge>
            </div>

            {roomCompliance.length === 0 ? (
              <div className="text-center py-8">
                <Square className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No classrooms found to validate</p>
                <p className="text-sm mt-1 text-muted-foreground">Add rooms with 'classroom' function to see compliance</p>
              </div>
            ) : (
              <div className="space-y-3">
                {roomCompliance.map((result) => (
                  <Card key={result.room.id} className={result.isCompliant ? 'border-green-600' : 'border-red-600'}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {result.isCompliant ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <h4 className="font-medium">{result.room.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {result.grade}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current Size:</span>
                              <p className="font-medium">{result.room.square_footage.toLocaleString()} sq ft</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Required:</span>
                              <p className="font-medium">{result.requiredSize.toLocaleString()} sq ft</p>
                            </div>
                            {!result.isCompliant && (
                              <div>
                                <span className="text-red-500">Deficit:</span>
                                <p className="text-red-500 font-medium">{result.deficit.toLocaleString()} sq ft</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {nonCompliantRooms.length > 0 && (
                  <Card className="border-yellow-600">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-yellow-500" />
                        <h4 className="font-medium text-yellow-500">Compliance Summary</h4>
                      </div>
                      <p className="text-sm text-yellow-500">
                        {nonCompliantRooms.length} classroom{nonCompliantRooms.length !== 1 ? 's' : ''} below minimum size requirements.
                        Total deficit: {nonCompliantRooms.reduce((sum, room) => sum + room.deficit, 0).toLocaleString()} sq ft
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="restrooms" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Restroom Compliance Calculator</h3>
              <div className="flex gap-2">
                {restroomCompliant.toilets && restroomCompliant.sinks ? (
                  <Badge variant="default" className="bg-green-600 text-white flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Compliant
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Non-Compliant
                  </Badge>
                )}
              </div>
            </div>

            {/* Current Fixtures Display */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Building Restroom Fixtures</CardTitle>
                <CardDescription className="text-xs">
                  Data from building information - edit building to update
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Boys Restrooms */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Boys Restrooms</h4>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Toilets</span>
                      <span className="font-medium">{building?.boys_toilets || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Urinals</span>
                      <span className="font-medium">{building?.boys_urinals || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Sinks</span>
                      <span className="font-medium">{building?.boys_sinks || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Restrooms</span>
                      <span className="font-medium">{building?.boys_restrooms_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Girls Restrooms */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Girls Restrooms</h4>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Toilets</span>
                      <span className="font-medium">{building?.girls_toilets || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Urinals</span>
                      <span className="font-medium">{building?.girls_urinals || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Sinks</span>
                      <span className="font-medium">{building?.girls_sinks || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Restrooms</span>
                      <span className="font-medium">{building?.girls_restrooms_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Unisex/Family Restrooms */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Unisex/Family Restrooms</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Toilets</span>
                      <span className="font-medium">{building?.unisex_toilets || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Sinks</span>
                      <span className="font-medium">{building?.unisex_sinks || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Restrooms</span>
                      <span className="font-medium">{building?.unisex_restrooms_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Staff Restrooms */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Staff/Faculty Restrooms</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Toilets</span>
                      <span className="font-medium">{building?.staff_toilets || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Sinks</span>
                      <span className="font-medium">{building?.staff_sinks || 0}</span>
                    </div>
                    <div className="bg-muted rounded p-2">
                      <span className="text-muted-foreground block">Restrooms</span>
                      <span className="font-medium">{building?.staff_restrooms_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Requirements Summary */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-sm">Required Fixtures</CardTitle>
                    <CardDescription>Based on current occupancy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-2">Student Requirements</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Girls Toilets:</span>
                              <span className="font-medium">{restroomRequirements.students.girlsToilets}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Boys Toilets:</span>
                              <span className="font-medium">{restroomRequirements.students.boysToilets}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Lavatories:</span>
                              <span className="font-medium">{restroomRequirements.students.totalLavatories}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-2">Staff Requirements</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Staff Toilets:</span>
                              <span className="font-medium">{restroomRequirements.staff.toilets}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h5 className="text-sm font-medium mb-2">Total Requirements</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Minimum Toilets:</span>
                            <span className={`font-medium ${restroomCompliant.toilets ? 'text-green-500' : 'text-red-500'}`}>
                              {currentRestroomFixtures.toilets} / {restroomRequirements.total.minToilets}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Minimum Sinks:</span>
                            <span className={`font-medium ${restroomCompliant.sinks ? 'text-green-500' : 'text-red-500'}`}>
                              {currentRestroomFixtures.sinks} / {restroomRequirements.total.minSinks}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="occupancy" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Occupancy & Loading Calculator</h3>
              <div className="flex gap-2">
                {overCapacityRooms.length === 0 ? (
                  <Badge variant="default" className="bg-green-600 text-white flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Within Limits
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Over Capacity
                  </Badge>
                )}
              </div>
            </div>

            {occupancyData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No rooms found to calculate occupancy</p>
                <p className="text-sm mt-1 text-muted-foreground">Add rooms to see maximum safe occupancy calculations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Occupancy Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Max Occupancy</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {occupancyData.reduce((sum, data) => sum + data.maxOccupancy, 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-muted-foreground">Current Occupancy</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">
                        {occupancyData.reduce((sum, data) => sum + data.currentOccupancy, 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">Over Capacity</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">
                        {overCapacityRooms.length}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-muted-foreground">Avg Utilization</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">
                        {occupancyData.length > 0 ? 
                          (occupancyData.reduce((sum, data) => sum + data.utilizationRate, 0) / occupancyData.length).toFixed(1) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Rooms Occupancy Table */}
                <Card className="bg-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Room Occupancy Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                      <table className="w-full min-w-[800px]">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Room</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Area (sq ft)</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Standard</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Max Occupancy</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Current</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Utilization</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {occupancyData.map((data) => (
                            <tr key={data.room.id} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-primary" />
                                                                     <div>
                                     <div className="font-medium text-white">{data.room.name}</div>
                                     {data.room.room_number && (
                                       <div className="text-xs text-gray-500">Room {data.room.room_number}</div>
                                     )}
                                   </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    data.roomType === 'classroom' ? 'border-blue-500 text-blue-400' :
                                    data.roomType === 'office' ? 'border-green-500 text-green-400' :
                                    data.roomType === 'library' ? 'border-purple-500 text-purple-400' :
                                    data.roomType === 'auditorium' ? 'border-red-500 text-red-400' :
                                    data.roomType === 'cafeteria' ? 'border-yellow-500 text-yellow-400' :
                                    'border-gray-600 text-gray-400'
                                  }`}
                                >
                                  {data.roomType.charAt(0).toUpperCase() + data.roomType.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300 font-medium">
                                {data.room.square_footage?.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                {data.sqFtPerPerson} sq ft/person
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300 font-medium">
                                {data.maxOccupancy}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300 font-medium">
                                {data.currentOccupancy}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        data.utilizationRate > 100 ? 'bg-red-500' :
                                        data.utilizationRate > 80 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${Math.min(data.utilizationRate, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 w-12">
                                    {data.utilizationRate.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {data.isOverCapacity ? (
                                  <Badge className="bg-red-600/20 text-red-400 border-red-600/50">
                                    Over Capacity
                                  </Badge>
                                ) : data.utilizationRate > 80 ? (
                                  <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/50">
                                    Near Limit
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-600/20 text-green-400 border-green-600/50">
                                    Safe
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Occupancy Standards Reference */}
                <Card className="bg-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Occupancy Standards</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <h4 className="text-white font-medium">Educational Spaces:</h4>
                        <p className="text-gray-400">• Classrooms: 25 sq ft per student</p>
                        <p className="text-gray-400">• Libraries: 6 sq ft per student</p>
                        <p className="text-gray-400">• Laboratories: 50 sq ft per student</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-white font-medium">Assembly Spaces:</h4>
                        <p className="text-gray-400">• Auditoriums: 15 sq ft per person</p>
                        <p className="text-gray-400">• Cafeterias: 15 sq ft per person</p>
                        <p className="text-gray-400">• Gymnasiums: 15 sq ft per person</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Occupancy Settings</CardTitle>
                <CardDescription>Update student and staff counts for calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentCount">Student Count</Label>
                    <Input
                      id="studentCount"
                      type="number"
                      value={currentStudentCount}
                      onChange={(e) => setCurrentStudentCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffCount">Staff Count</Label>
                    <Input
                      id="staffCount"
                      type="number"
                      value={currentStaffCount}
                      onChange={(e) => setCurrentStaffCount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCountUpdate}
                  className="mt-4"
                >
                  Update Counts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 