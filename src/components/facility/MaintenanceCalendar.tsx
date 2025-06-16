'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, List, Grid2X2 } from 'lucide-react';

interface MaintenanceEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    description: string;
    status: string;
    type: string;
    system: string;
  };
}

interface MaintenanceCalendarProps {
  facilityId: string;
}

export default function MaintenanceCalendar({ facilityId }: MaintenanceCalendarProps) {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceSchedules();
  }, [facilityId]);

  const fetchMaintenanceSchedules = async () => {
    try {
      const response = await fetch(`/api/facilities/${facilityId}/maintenance`);
      const data = await response.json();
      
      // Transform maintenance schedules into calendar events
      const calendarEvents = data.map((schedule: any) => ({
        id: schedule.id,
        title: schedule.title,
        start: schedule.next_maintenance_date,
        allDay: true,
        backgroundColor: getStatusColor(schedule.status),
        borderColor: getStatusColor(schedule.status),
        textColor: '#ffffff',
        extendedProps: {
          description: schedule.description,
          status: schedule.status,
          type: schedule.maintenance_type,
          system: schedule.system_name
        }
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#8b5cf6'; // Purple
      case 'in-progress':
        return '#3b82f6'; // Blue
      case 'completed':
        return '#10b981'; // Green
      case 'overdue':
        return '#ef4444'; // Red
      case 'cancelled':
        return '#6b7280'; // Gray
      default:
        return '#8b5cf6'; // Default purple
    }
  };

  const handleEventClick = (info: any) => {
    // Show event details in a modal or tooltip
    console.log('Event clicked:', info.event);
  };

  return (
    <Card className="p-6 bg-gray-900/50 border-gray-700/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Maintenance Schedule</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('dayGridMonth')}
            className={`border-gray-700 ${
              view === 'dayGridMonth' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('timeGridWeek')}
            className={`border-gray-700 ${
              view === 'timeGridWeek' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('listWeek')}
            className={`border-gray-700 ${
              view === 'listWeek' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          themeSystem="standard"
          dayMaxEvents={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={true}
          nowIndicator={true}
                     eventDisplay="block"
           eventClassNames="rounded-lg"
        />

        <style jsx global>{`
          .fc {
            --fc-border-color: rgba(75, 85, 99, 0.3);
            --fc-button-bg-color: rgba(75, 85, 99, 0.2);
            --fc-button-border-color: rgba(75, 85, 99, 0.3);
            --fc-button-hover-bg-color: rgba(139, 92, 246, 0.8);
            --fc-button-hover-border-color: rgba(139, 92, 246, 0.8);
            --fc-button-active-bg-color: rgba(139, 92, 246, 1);
            --fc-button-active-border-color: rgba(139, 92, 246, 1);
            --fc-event-bg-color: rgba(139, 92, 246, 0.8);
            --fc-event-border-color: rgba(139, 92, 246, 0.8);
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: rgba(31, 41, 55, 0.5);
            font-family: inherit;
          }

          .fc .fc-toolbar-title {
            color: white;
          }

          .fc .fc-button {
            color: white;
          }

          .fc .fc-daygrid-day-number,
          .fc .fc-col-header-cell-cushion {
            color: white;
          }

          .fc .fc-daygrid-day.fc-day-today {
            background-color: rgba(139, 92, 246, 0.1);
          }

          .fc-event {
            cursor: pointer;
            padding: 2px 4px;
            margin: 1px 0;
            border-radius: 4px;
          }

          .fc-event:hover {
            filter: brightness(1.1);
          }

          .fc-daygrid-event-dot {
            display: none;
          }
        `}</style>
      </div>
    </Card>
  );
} 