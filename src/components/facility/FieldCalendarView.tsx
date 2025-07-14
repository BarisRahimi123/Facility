'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Clock, 
  Users, 
  Ban,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Field, Reservation } from '@/types/field';
import type { FieldBlackoutDate } from '@/types/field';
import { createBlockout, deleteBlockout, getFieldBlockouts } from '@/app/actions/staff';
import { useToast } from '@/components/ui/use-toast';
import type { CreateBlockoutFormData, FieldBlockoutDate as StaffFieldBlockoutDate } from '@/types/staff';
import { BlackoutDateModal } from './BlackoutDateModal';

interface FieldCalendarViewProps {
  facilityId: string;
  fields: Field[];
  reservations: Reservation[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayNumber: number;
}

export function FieldCalendarView({ facilityId, fields, reservations }: FieldCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blackoutDates, setBlackoutDates] = useState<FieldBlackoutDate[]>([]);
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);
  const [selectedBlackout, setSelectedBlackout] = useState<FieldBlackoutDate | null>(null);
  const [isLoadingBlockouts, setIsLoadingBlockouts] = useState(false);
  const { toast } = useToast();

  // Convert staff blockout date to field blockout date format
  const convertStaffToFieldBlockout = (staffBlockout: StaffFieldBlockoutDate): FieldBlackoutDate => {
    return {
      id: staffBlockout.id,
      field_id: staffBlockout.field_id,
      start_date: staffBlockout.start_date,
      end_date: staffBlockout.end_date,
      start_time: staffBlockout.start_time,
      end_time: staffBlockout.end_time,
      reason: staffBlockout.reason,
      recurring: staffBlockout.recurring,
      recurring_pattern: staffBlockout.recurring_pattern ? 'weekly' : undefined, // Simple conversion
      created_at: staffBlockout.created_at,
      created_by: staffBlockout.created_by || undefined
    };
  };

  // Generate calendar days for the current month
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
        dayNumber: date.getDate()
      });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: isToday(date),
        dayNumber: i
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
        dayNumber: i
      });
    }
    
    return days;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getFieldReservations = (fieldId: string, date: Date): Reservation[] => {
    const dateStr = date.toDateString();
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.start_time).toDateString();
      return reservation.field_id === fieldId && reservationDate === dateStr;
    });
  };

  const getFieldBlackoutDates = (fieldId: string, date: Date): FieldBlackoutDate[] => {
    const dateStr = date.toISOString().split('T')[0];
    return blackoutDates.filter(blackout => {
      return blackout.field_id === fieldId && 
             blackout.start_date <= dateStr && 
             blackout.end_date >= dateStr;
    });
  };

  const handleCellClick = (field: Field, date: Date) => {
    if (!date) return;
    setSelectedField(field);
    setSelectedDate(date);
    setSelectedBlackout(null);
    setIsBlackoutModalOpen(true);
  };

  const handleBlackoutEdit = (blackout: FieldBlackoutDate) => {
    setSelectedBlackout(blackout);
    setSelectedField(fields.find(f => f.id === blackout.field_id) || null);
    setIsBlackoutModalOpen(true);
  };

  // Load blackout dates from the database
  const loadBlackoutDates = async () => {
    if (!fields || fields.length === 0) return;
    
    setIsLoadingBlockouts(true);
    try {
      const allBlackouts: FieldBlackoutDate[] = [];
      
      // Load blackouts for each field
      for (const field of fields) {
        const response = await getFieldBlockouts(field.id);
        if (response.data) {
          // Filter out room blockouts and convert to field blockout format
          const fieldBlockouts = response.data
            .filter((b): b is StaffFieldBlockoutDate => 'field_id' in b)
            .map(convertStaffToFieldBlockout);
          allBlackouts.push(...fieldBlockouts);
        }
      }
      
      setBlackoutDates(allBlackouts);
    } catch (error) {
      console.error('Error loading blackout dates:', error);
    } finally {
      setIsLoadingBlockouts(false);
    }
  };

  const handleBlackoutSave = async (blackoutData: Partial<FieldBlackoutDate>) => {
    if (!selectedField) return;
    
    try {
      // Create the blockout data in the format expected by the server action
      const createData: CreateBlockoutFormData = {
        field_id: selectedField.id,
        start_date: blackoutData.start_date || selectedDate?.toISOString().split('T')[0] || '',
        end_date: blackoutData.end_date || blackoutData.start_date || selectedDate?.toISOString().split('T')[0] || '',
        reason: blackoutData.reason || '',
        description: '',
        recurring: blackoutData.recurring || false,
        // Don't include recurring_pattern for now since the types are incompatible
        start_time: blackoutData.start_time,
        end_time: blackoutData.end_time
      };

      const response = await createBlockout(createData);
      
      // Close modal immediately after attempting to create blockout
      setIsBlackoutModalOpen(false);
      
      if (response.error) {
        toast({
          title: "Error creating blockout",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Blackout created",
          description: "Field availability has been blocked successfully.",
        });
        
        // Reload blockout dates in background
        await loadBlackoutDates();
      }
    } catch (error) {
      console.error('Error saving blockout:', error);
      
      // Close modal even if there's an error
      setIsBlackoutModalOpen(false);
      
      toast({
        title: "Failed to save blackout",
        description: "There was an error saving the blockout period. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBlackoutDelete = async (blackoutId: string) => {
    try {
      const response = await deleteBlockout(blackoutId);
      
      if (response.error) {
        toast({
          title: "Error deleting blockout",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Blackout deleted",
          description: "The blockout period has been removed successfully.",
        });
        
        // Reload blockout dates
        await loadBlackoutDates();
      }
    } catch (error) {
      console.error('Error deleting blockout:', error);
      toast({
        title: "Failed to delete blackout",
        description: "There was an error deleting the blackout period. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getReservationStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 border-green-500 text-green-400';
      case 'pending': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'cancelled': return 'bg-red-500/20 border-red-500 text-red-400';
      default: return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Load blackout dates when component mounts or fields change
  useEffect(() => {
    loadBlackoutDates();
  }, [fields]);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card className="bg-card/60 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Field Availability Calendar
              </CardTitle>
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
                {formatMonthYear(currentDate)}
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

      {/* Legend */}
      <Card className="bg-card/60 border-border">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/20 border border-green-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500/20 border border-blue-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 border border-red-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Blackout/Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Pending Approval</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Click on any field date to manage availability
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="bg-card/60 border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header with field names and weekdays */}
              <div className="border-b border-border">
                {/* Field Names Row */}
                <div className="grid grid-cols-8 gap-0">
                  <div className="p-4 bg-muted/50 border-r border-border">
                    <span className="font-semibold text-card-foreground">Fields</span>
                  </div>
                  {weekDays.map(day => (
                    <div key={day} className="p-2 bg-muted/50 text-center border-r border-border last:border-r-0">
                      <span className="font-medium text-muted-foreground text-sm">{day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Body */}
              <div className="divide-y divide-border">
                {/* Week Headers */}
                {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => {
                  const weekStart = weekIndex * 7;
                  const weekDays = calendarDays.slice(weekStart, weekStart + 7);
                  
                  return (
                    <div key={weekIndex}>
                      {/* Date Numbers Row */}
                      <div className="grid grid-cols-8 gap-0 border-b border-border">
                        <div className="p-2 bg-muted/30 border-r border-border">
                          <span className="text-xs text-muted-foreground">
                            Week {weekIndex + 1}
                          </span>
                        </div>
                        {weekDays.map((day, dayIndex) => (
                          <div 
                            key={dayIndex}
                            className={`p-2 text-center border-r border-border last:border-r-0 ${
                              day.isCurrentMonth ? 'bg-background' : 'bg-muted/20'
                            } ${day.isToday ? 'bg-primary/10' : ''}`}
                          >
                            <span className={`text-sm font-medium ${
                              day.isCurrentMonth ? 'text-card-foreground' : 'text-muted-foreground'
                            } ${day.isToday ? 'text-primary' : ''}`}>
                              {day.dayNumber}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Field Rows for this week */}
                      {fields.map(field => (
                        <div key={field.id} className="grid grid-cols-8 gap-0 border-b border-border last:border-b-0">
                          {/* Field Name Column */}
                          <div className="p-3 bg-muted/30 border-r border-border">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span className="font-medium text-card-foreground text-sm truncate">
                                {field.name}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {field.type} • ${field.hourly_rate}/hr
                            </div>
                          </div>

                          {/* Field Calendar Cells */}
                          {weekDays.map((day, dayIndex) => {
                            const fieldReservations = getFieldReservations(field.id, day.date);
                            const fieldBlackouts = getFieldBlackoutDates(field.id, day.date);
                            const hasReservations = fieldReservations.length > 0;
                            const hasBlackouts = fieldBlackouts.length > 0;
                            
                            return (
                              <div 
                                key={dayIndex}
                                className={`p-1 border-r border-border last:border-r-0 min-h-[80px] cursor-pointer hover:bg-accent/50 transition-colors ${
                                  day.isCurrentMonth ? 'bg-background' : 'bg-muted/10'
                                } ${day.isToday ? 'bg-primary/5' : ''}`}
                                onClick={() => handleCellClick(field, day.date)}
                              >
                                <div className="space-y-1">
                                  {/* Reservations */}
                                  {fieldReservations.slice(0, 2).map(reservation => (
                                    <div 
                                      key={reservation.id}
                                      className={`text-xs p-1 rounded border ${getReservationStatusColor(reservation.status)}`}
                                      title={`${reservation.renter_name} - ${reservation.purpose_of_use}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span className="truncate">{reservation.renter_name}</span>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Blackout Periods */}
                                  {fieldBlackouts.map(blackout => (
                                    <div 
                                      key={blackout.id}
                                      className="text-xs p-1 rounded border bg-red-500/20 border-red-500 text-red-400"
                                      title={blackout.reason}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBlackoutEdit(blackout);
                                      }}
                                    >
                                      <div className="flex items-center gap-1">
                                        <Ban className="h-3 w-3" />
                                        <span className="truncate">{blackout.reason}</span>
                                      </div>
                                      {blackout.start_time && (
                                        <div className="flex items-center gap-1 mt-1">
                                          <Clock className="h-2 w-2" />
                                          <span>{blackout.start_time} - {blackout.end_time}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  
                                  {/* Show remaining count if more items */}
                                  {(fieldReservations.length > 2) && (
                                    <div className="text-xs text-muted-foreground">
                                      +{fieldReservations.length - 2} more
                                    </div>
                                  )}
                                  
                                  {/* Available indicator */}
                                  {!hasReservations && !hasBlackouts && day.isCurrentMonth && (
                                    <div className="text-xs text-green-400 p-1">
                                      Available
                                    </div>
                                  )}
                                  
                                  {/* Add blackout button */}
                                  {day.isCurrentMonth && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full h-6 text-xs opacity-0 hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCellClick(field, day.date);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Block
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blackout Date Management Modal */}
      <BlackoutDateModal
        isOpen={isBlackoutModalOpen}
        onClose={() => setIsBlackoutModalOpen(false)}
        onSave={handleBlackoutSave}
        onDelete={selectedBlackout ? handleBlackoutDelete : undefined}
        field={selectedField}
        selectedDate={selectedDate}
        blackoutDate={selectedBlackout}
      />
    </div>
  );
} 