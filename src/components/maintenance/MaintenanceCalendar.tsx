'use client';

import { useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { MaintenanceTask } from '@/types/maintenance';

interface MaintenanceCalendarProps {
  tasks: MaintenanceTask[];
  onTaskClick: (task: MaintenanceTask) => void;
  onSelectTimeSlot: (start: Date, end: Date) => void;
}

export default function MaintenanceCalendar({
  tasks,
  onTaskClick,
  onSelectTimeSlot,
}: MaintenanceCalendarProps) {
  const events = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    start: task.startDate,
    end: task.endDate || undefined,
    allDay: !task.endDate,
    extendedProps: task,
    backgroundColor: getTaskColor(task),
    borderColor: getTaskColor(task),
    textColor: getTaskTextColor(task),
  }));

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const task = arg.event.extendedProps as MaintenanceTask;
      onTaskClick(task);
    },
    [onTaskClick]
  );

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      onSelectTimeSlot(arg.start, arg.end);
    },
    [onSelectTimeSlot]
  );

  return (
    <div className="bg-white rounded-lg shadow h-[calc(100vh-180px)] flex flex-col w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1a73e8]" />
          <span className="text-sm text-gray-600">Preventive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#7c3aed]" />
          <span className="text-sm text-gray-600">Corrective</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#dc2626]" />
          <span className="text-sm text-gray-600">Emergency</span>
        </div>
      </div>

      <div className="flex-1 p-2">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          selectable={true}
          select={handleSelect}
          editable={false}
          dayMaxEvents={true}
          nowIndicator={true}
          height="100%"
          stickyHeaderDates={true}
          expandRows={true}
        />
      </div>
    </div>
  );
}

function getTaskColor(task: MaintenanceTask): string {
  // Modern color palette
  const typeColors = {
    preventive: '#1a73e8', // Brand blue
    corrective: '#7c3aed', // Modern purple
    emergency: '#dc2626', // Modern red
  };

  // Status opacity modifiers
  const statusOpacity = {
    pending: '1',
    in_progress: '0.8',
    completed: '0.6',
    cancelled: '0.4',
  };

  // Get base color from type
  const baseColor = typeColors[task.type];

  // Convert hex to RGB and apply opacity
  const opacity = statusOpacity[task.status];
  if (opacity === '1') return baseColor;

  // Convert hex to rgba for other opacities
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getTaskTextColor(task: MaintenanceTask): string {
  // Always return white for better contrast
  return '#FFFFFF';
} 