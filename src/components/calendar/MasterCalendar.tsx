'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Grid3X3,
  Users,
  Wrench,
  Ban,
  Filter,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'room_reservation' | 'field_reservation' | 'maintenance' | 'blackout' | 'event';
  location: string;
  locationId: string;
  locationType: 'building' | 'field' | 'room';
  status?: string;
  description?: string;
  color: string;
}

interface MasterCalendarProps {
  facilityId: string;
  facilityName?: string;
  buildings?: any[];
  fields?: any[];
  reservations?: any[];
  blackoutDates?: any[];
  maintenanceEvents?: any[];
}

export function MasterCalendar({
  facilityId,
  facilityName,
  buildings = [],
  fields = [],
  reservations = [],
  blackoutDates = [],
  maintenanceEvents = []
}: MasterCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['all']);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState({
    room_reservation: true,
    field_reservation: true,
    maintenance: true,
    blackout: true,
    event: true
  });

  // Convert raw data to calendar events
  useEffect(() => {
    const allEvents: CalendarEvent[] = [];

    // Process room reservations
    reservations.forEach((reservation: any) => {
      if (reservation.room_id) {
        allEvents.push({
          id: reservation.id,
          title: `Room: ${reservation.renter_name}`,
          start: parseISO(reservation.start_time),
          end: parseISO(reservation.end_time),
          type: 'room_reservation',
          location: reservation.room_name || 'Room',
          locationId: reservation.room_id,
          locationType: 'room',
          status: reservation.status,
          description: reservation.purpose_of_use,
          color: 'bg-blue-500'
        });
      }
    });

    // Process field reservations
    reservations.forEach((reservation: any) => {
      if (reservation.field_id) {
        allEvents.push({
          id: reservation.id,
          title: `Field: ${reservation.renter_name}`,
          start: parseISO(reservation.start_time),
          end: parseISO(reservation.end_time),
          type: 'field_reservation',
          location: reservation.field_name || 'Field',
          locationId: reservation.field_id,
          locationType: 'field',
          status: reservation.status,
          description: reservation.purpose_of_use,
          color: 'bg-green-500'
        });
      }
    });

    // Process blackout dates
    blackoutDates.forEach((blackout: any) => {
      allEvents.push({
        id: blackout.id,
        title: `Blackout: ${blackout.reason}`,
        start: parseISO(blackout.start_date),
        end: parseISO(blackout.end_date),
        type: 'blackout',
        location: blackout.location_name || 'Facility',
        locationId: blackout.location_id,
        locationType: blackout.location_type || 'building',
        description: blackout.reason,
        color: 'bg-red-500'
      });
    });

    // Process maintenance events
    maintenanceEvents.forEach((maintenance: any) => {
      allEvents.push({
        id: maintenance.id,
        title: `Maintenance: ${maintenance.title}`,
        start: parseISO(maintenance.start_date),
        end: parseISO(maintenance.end_date),
        type: 'maintenance',
        location: maintenance.location_name || 'Facility',
        locationId: maintenance.location_id,
        locationType: maintenance.location_type || 'building',
        description: maintenance.description,
        color: 'bg-yellow-500'
      });
    });

    setEvents(allEvents);
  }, [reservations, blackoutDates, maintenanceEvents]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
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
        return <Building2 className="h-3 w-3" />;
      case 'field_reservation':
        return <Grid3X3 className="h-3 w-3" />;
      case 'maintenance':
        return <Wrench className="h-3 w-3" />;
      case 'blackout':
        return <Ban className="h-3 w-3" />;
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
              <CardTitle className="text-2xl font-bold text-card-foreground">
                Master Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                All events for {facilityName || 'Facility'}
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
                <Building2 className="h-3 w-3" />
                Room Reservations
              </Button>
              
              <Button
                variant={visibleEventTypes.field_reservation ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEventType('field_reservation')}
                className="gap-2"
              >
                {visibleEventTypes.field_reservation ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <Grid3X3 className="h-3 w-3" />
                Field Reservations
              </Button>
              
              <Button
                variant={visibleEventTypes.maintenance ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEventType('maintenance')}
                className="gap-2"
              >
                {visibleEventTypes.maintenance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <Wrench className="h-3 w-3" />
                Maintenance
              </Button>
              
              <Button
                variant={visibleEventTypes.blackout ? "default" : "outline"}
                size="sm"
                onClick={() => toggleEventType('blackout')}
                className="gap-2"
              >
                {visibleEventTypes.blackout ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <Ban className="h-3 w-3" />
                Blackouts
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
    </div>
  );
} 