'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { FacilitySystem } from '@/types/facility';
import { Button } from '@/components/ui/button';

interface MaintenanceCalendarProps {
  systems: FacilitySystem[];
  onScheduleMaintenance: (systemId: string) => void;
}

interface MaintenanceEvent {
  id: string;
  title: string;
  date: Date;
  system: FacilitySystem;
}

export default function MaintenanceCalendar({
  systems,
  onScheduleMaintenance
}: MaintenanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Get maintenance events for the current month
  const maintenanceEvents: MaintenanceEvent[] = systems
    .filter(system => {
      const nextMaintenance = new Date(system.next_maintenance);
      return nextMaintenance >= firstDayOfMonth && nextMaintenance <= lastDayOfMonth;
    })
    .map(system => ({
      id: system.id,
      title: `${system.name} Maintenance`,
      date: new Date(system.next_maintenance),
      system
    }));

  // Calendar navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Get calendar grid data
  const getDaysInMonth = () => {
    const days = [];
    const firstDay = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return maintenanceEvents.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square p-2 bg-gray-50"
                />
              );
            }

            const events = getEventsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === day.toDateString();

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square p-2 border rounded-lg cursor-pointer
                  ${isToday ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  ${events.length > 0 ? 'border-blue-200' : ''}
                `}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-sm font-medium mb-1">
                  {day.getDate()}
                </div>
                {events.length > 0 && (
                  <div className="space-y-1">
                    {events.map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-blue-100 text-blue-700 rounded truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="border-t p-4">
          <h3 className="text-sm font-medium mb-2">
            {selectedDate.toLocaleDateString('default', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).map(event => (
              <div
                key={event.id}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      System Type: {event.system.type}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onScheduleMaintenance(event.system.id)}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-sm text-gray-500">
                No maintenance scheduled for this day
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 