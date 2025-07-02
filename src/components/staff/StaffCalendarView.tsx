'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Ban, 
  Clock, 
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { getBlockoutsForFields, deleteBlockout } from '@/app/actions/staff';
import type { FacilityWithFields, FieldBlockoutDate, CalendarDay } from '@/types/staff';
import { useToast } from '@/components/ui/use-toast';

interface StaffCalendarViewProps {
  facility: FacilityWithFields;
  onBlockoutCreated: () => void;
}

export default function StaffCalendarView({ facility, onBlockoutCreated }: StaffCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blockouts, setBlockouts] = useState<FieldBlockoutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBlockouts();
  }, [facility.id, currentDate]);

  const loadBlockouts = async () => {
    try {
      setLoading(true);
      const fieldIds = facility.fields.map(field => field.id);
      const response = await getBlockoutsForFields(fieldIds);
      
      if (response.error) {
        toast({
          title: "Error loading blockouts",
          description: response.error,
          variant: "destructive"
        });
      } else {
        setBlockouts(response.data || []);
      }
    } catch (error) {
      toast({
        title: "Error loading blockouts",
        description: "Failed to load calendar data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlockout = async (blockoutId: string) => {
    try {
      const response = await deleteBlockout(blockoutId);
      
      if (response.error) {
        toast({
          title: "Error deleting blockout",
          description: response.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Blockout deleted",
          description: "The blockout has been cancelled successfully",
        });
        loadBlockouts(); // Refresh data
      }
    } catch (error) {
      toast({
        title: "Error deleting blockout",
        description: "Failed to delete blockout",
        variant: "destructive"
      });
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: CalendarDay[] = [];
    
    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        dayNumber: date.getDate(),
        blockouts: [],
        reservations: []
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayBlockouts = blockouts.filter(blockout => {
        const blockoutStart = new Date(blockout.start_date);
        const blockoutEnd = new Date(blockout.end_date);
        return date >= blockoutStart && date <= blockoutEnd;
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        dayNumber: i,
        blockouts: dayBlockouts,
        reservations: []
      });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: isToday(date),
        dayNumber: i,
        blockouts: [],
        reservations: []
      });
    }
    
    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{formatMonthYear(currentDate)}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fields Legend */}
      <div className="flex flex-wrap gap-2">
        {facility.fields.map(field => (
          <Badge key={field.id} variant="secondary" className="text-xs">
            {field.name} - {field.type}
          </Badge>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg ${
                  day.isCurrentMonth ? 'bg-background' : 'bg-muted/50'
                } ${
                  day.isToday ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {day.dayNumber}
                </div>

                {/* Blockouts for this day */}
                <div className="space-y-1">
                  {day.blockouts.map(blockout => {
                    const field = facility.fields.find(f => f.id === blockout.field_id);
                    return (
                      <div
                        key={blockout.id}
                        className="text-xs p-1 rounded border bg-red-500/20 border-red-500 text-red-700 dark:text-red-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            <span className="truncate">{blockout.reason}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-red-600"
                              onClick={() => handleDeleteBlockout(blockout.id)}
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">{field?.name}</span>
                          {blockout.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-2 w-2" />
                              <span>{blockout.start_time} - {blockout.end_time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockouts Summary */}
      <Card>
        <CardContent className="pt-6">
          <h4 className="font-medium mb-4">Active Blockouts This Month</h4>
          <div className="space-y-3">
            {blockouts
              .filter(blockout => {
                const blockoutDate = new Date(blockout.start_date);
                return blockoutDate.getMonth() === currentDate.getMonth() &&
                       blockoutDate.getFullYear() === currentDate.getFullYear();
              })
              .map(blockout => {
                const field = facility.fields.find(f => f.id === blockout.field_id);
                return (
                  <div key={blockout.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Ban className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{blockout.reason}</span>
                        <Badge variant="outline" className="text-xs">
                          {field?.name}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(blockout.start_date), 'MMM d')} - {format(new Date(blockout.end_date), 'MMM d')}
                        {blockout.start_time && (
                          <span className="ml-2">
                            {blockout.start_time} - {blockout.end_time}
                          </span>
                        )}
                      </div>
                      {blockout.description && (
                        <p className="text-sm text-muted-foreground mt-1">{blockout.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBlockout(blockout.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            
            {blockouts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No blockouts for this month
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 