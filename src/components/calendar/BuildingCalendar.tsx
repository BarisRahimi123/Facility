'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Wrench,
  Clock,
  Users,
  AlertCircle,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';

interface BuildingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'room_reservation' | 'maintenance' | 'system_maintenance';
  location: string;
  locationId: string;
  status?: string;
  description?: string;
  color: string;
  priority?: string;
}

interface BuildingCalendarProps {
  buildingId: string;
  buildingName?: string;
  rooms?: any[];
  maintenanceEvents?: any[];
  systems?: any[];
  reservations?: any[];
}

export function BuildingCalendar({
  buildingId,
  buildingName,
  rooms = [],
  maintenanceEvents = [],
  systems = [],
  reservations = []
}: BuildingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<BuildingEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<BuildingEvent | null>(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState({
    room_reservation: true,
    maintenance: true,
    system_maintenance: true
  });

  // Convert raw data to calendar events
  useEffect(() => {
    const allEvents: BuildingEvent[] = [];

    // Process room reservations
    reservations.forEach((reservation: any) => {
      if (reservation.room_id) {
        const room = rooms.find(r => r.id === reservation.room_id);
        allEvents.push({
          id: reservation.id,
          title: `Room ${room?.room_number || ''}: ${reservation.renter_name}`,
          start: parseISO(reservation.start_time),
          end: parseISO(reservation.end_time),
          type: 'room_reservation',
          location: `Room ${room?.room_number || reservation.room_id}`,
          locationId: reservation.room_id,
          status: reservation.status,
          description: reservation.purpose_of_use,
          color: 'bg-blue-500'
        });
      }
    });

    // Process maintenance requests
    maintenanceEvents.forEach((maintenance: any) => {
      allEvents.push({
        id: maintenance.id,
        title: `Maintenance: ${maintenance.title}`,
        start: maintenance.scheduled_date ? parseISO(maintenance.scheduled_date) : new Date(),
        end: maintenance.scheduled_date ? parseISO(maintenance.scheduled_date) : new Date(),
        type: 'maintenance',
        location: maintenance.room_id ? 
          `Room ${rooms.find(r => r.id === maintenance.room_id)?.room_number || ''}` : 
          'Building',
        locationId: maintenance.room_id || buildingId,
        status: maintenance.status,
        description: maintenance.description,
        color: maintenance.priority === 'high' ? 'bg-red-500' : 
               maintenance.priority === 'medium' ? 'bg-yellow-500' : 
               'bg-green-500',
        priority: maintenance.priority
      });
    });

    // Process system maintenance schedules
    systems.forEach((system: any) => {
      if (system.next_maintenance_date) {
        allEvents.push({
          id: `system-${system.id}`,
          title: `System: ${system.name} Maintenance`,
          start: parseISO(system.next_maintenance_date),
          end: parseISO(system.next_maintenance_date),
          type: 'system_maintenance',
          location: system.system_type,
          locationId: system.id,
          status: system.status,
          description: `Scheduled maintenance for ${system.name}`,
          color: 'bg-purple-500'
        });
      }
    });

    setEvents(allEvents);
  }, [reservations, maintenanceEvents, systems, rooms, buildingId]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getEventsForDay = (date: Date): BuildingEvent[] => {
    return events.filter(event => {
      const eventDate = event.start;
      return eventDate.toDateString() === date.toDateString() && 
             visibleEventTypes[event.type];
    });
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const toggleEventType = (type: keyof typeof visibleEventTypes) => {
    setVisibleEventTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'room_reservation':
        return <Users className="h-3 w-3" />;
      case 'maintenance':
        return <AlertCircle className="h-3 w-3" />;
      case 'system_maintenance':
        return <Wrench className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="bg-card/60 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Building Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Schedule for {buildingName || 'Building'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="border-border text-muted-foreground hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold text-card-foreground min-w-48 text-center">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="border-border text-muted-foreground hover:bg-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filter Controls */}
      <Card className="bg-card/60 border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Show:</span>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={visibleEventTypes.room_reservation ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEventType('room_reservation')}
                className="gap-2"
              >
                {visibleEventTypes.room_reservation ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <Users className="h-3 w-3" />
                Room Reservations
              </Button>
              
              <Button
                variant={visibleEventTypes.maintenance ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEventType('maintenance')}
                className="gap-2"
              >
                {visibleEventTypes.maintenance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <AlertCircle className="h-3 w-3" />
                Maintenance Requests
              </Button>
              
              <Button
                variant={visibleEventTypes.system_maintenance ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEventType('system_maintenance')}
                className="gap-2"
              >
                {visibleEventTypes.system_maintenance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <Wrench className="h-3 w-3" />
                System Maintenance
              </Button>
            </div>

            <div className="ml-auto">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-card/60 border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-muted/50 p-2 text-center">
                <span className="text-sm font-medium text-muted-foreground">{day}</span>
              </div>
            ))}
            
            {/* Calendar Days */}
            {getDaysInMonth().map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);
              
              return (
                <div
                  key={index}
                  className={`
                    min-h-[120px] p-2 bg-background
                    ${!isCurrentMonth ? 'opacity-50' : ''}
                    ${isTodayDate ? 'bg-primary/5' : ''}
                    hover:bg-accent/50 transition-colors cursor-pointer
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isTodayDate ? 'text-primary' : 'text-card-foreground'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded ${event.color} bg-opacity-20 border border-current cursor-pointer hover:bg-opacity-30`}
                        onClick={() => setSelectedEvent(event)}
                        title={event.description}
                      >
                        <div className="flex items-center gap-1">
                          {getEventTypeIcon(event.type)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/60 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Room Reservations</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter(e => e.type === 'room_reservation').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance Tasks</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter(e => e.type === 'maintenance').length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {events.filter(e => e.type === 'maintenance' && e.priority === 'high').length} high priority
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Maintenance</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter(e => e.type === 'system_maintenance').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 