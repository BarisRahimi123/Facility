import { Field, Reservation, FieldBlackoutDate } from '@/types/field';

export interface AvailabilityCheck {
  date: string; // YYYY-MM-DD format
  isAvailable: boolean;
  reason?: string;
  conflictType?: 'blackout' | 'reservation' | 'maintenance';
  conflictDetails?: {
    id: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
  };
}

export interface TimeSlotAvailability {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictType?: 'blackout' | 'reservation';
  conflictDetails?: any;
}

export class FieldAvailabilityService {
  
  /**
   * Check if a field is available for a specific date
   */
  static checkDateAvailability(
    field: Field,
    date: string, // YYYY-MM-DD format
    reservations: Reservation[] = [],
    blackoutDates: FieldBlackoutDate[] = []
  ): AvailabilityCheck {
    
    // Check if field is in maintenance
    if (field.maintenance_status === 'poor' || field.status === 'maintenance') {
      return {
        date,
        isAvailable: false,
        reason: 'Field is currently under maintenance',
        conflictType: 'maintenance'
      };
    }

    // Check blackout dates
    const blackoutConflict = this.checkBlackoutConflict(field.id, date, blackoutDates);
    if (blackoutConflict) {
      return {
        date,
        isAvailable: false,
        reason: `Field is unavailable: ${blackoutConflict.reason}`,
        conflictType: 'blackout',
        conflictDetails: {
          id: blackoutConflict.id,
          reason: blackoutConflict.reason,
          startTime: blackoutConflict.start_time,
          endTime: blackoutConflict.end_time
        }
      };
    }

    // Check for existing reservations (full day conflicts)
    const reservationConflict = this.checkReservationConflict(field.id, date, reservations);
    if (reservationConflict) {
      return {
        date,
        isAvailable: false,
        reason: `Field is already reserved by ${reservationConflict.renter_name}`,
        conflictType: 'reservation',
        conflictDetails: {
          id: reservationConflict.id,
          name: reservationConflict.renter_name,
          startTime: reservationConflict.start_time,
          endTime: reservationConflict.end_time
        }
      };
    }

    return {
      date,
      isAvailable: true
    };
  }

  /**
   * Check availability for a date range
   */
  static checkDateRangeAvailability(
    field: Field,
    startDate: string,
    endDate: string,
    reservations: Reservation[] = [],
    blackoutDates: FieldBlackoutDate[] = []
  ): AvailabilityCheck[] {
    const results: AvailabilityCheck[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const dateStr = current.toISOString().split('T')[0];
      const availability = this.checkDateAvailability(field, dateStr, reservations, blackoutDates);
      results.push(availability);
    }
    
    return results;
  }

  /**
   * Get available time slots for a specific date
   */
  static getAvailableTimeSlots(
    field: Field,
    date: string,
    reservations: Reservation[] = [],
    blackoutDates: FieldBlackoutDate[] = []
  ): TimeSlotAvailability[] {
    
    // Standard operating hours (can be made configurable per field)
    const operatingHours = {
      start: 6, // 6 AM
      end: 22   // 10 PM
    };

    const timeSlots: TimeSlotAvailability[] = [];
    
    // Generate hourly slots
    for (let hour = operatingHours.start; hour < operatingHours.end; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      const conflict = this.checkTimeSlotConflict(
        field.id, 
        date, 
        startTime, 
        endTime, 
        reservations, 
        blackoutDates
      );
      
      timeSlots.push({
        startTime,
        endTime,
        isAvailable: !conflict,
        conflictType: conflict?.type,
        conflictDetails: conflict?.details
      });
    }
    
    return timeSlots;
  }

  /**
   * Get next available dates for a field
   */
  static getNextAvailableDates(
    field: Field,
    fromDate: string = new Date().toISOString().split('T')[0],
    count: number = 10,
    reservations: Reservation[] = [],
    blackoutDates: FieldBlackoutDate[] = []
  ): AvailabilityCheck[] {
    const availableDates: AvailabilityCheck[] = [];
    const startDate = new Date(fromDate);
    const currentDate = new Date(startDate);
    let daysChecked = 0;
    const maxDaysToCheck = 60; // Limit search to 60 days
    
    while (availableDates.length < count && daysChecked < maxDaysToCheck) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const availability = this.checkDateAvailability(field, dateStr, reservations, blackoutDates);
      
      if (availability.isAvailable) {
        availableDates.push(availability);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }
    
    return availableDates;
  }

  /**
   * Check for blackout date conflicts
   */
  private static checkBlackoutConflict(
    fieldId: string,
    date: string,
    blackoutDates: FieldBlackoutDate[]
  ): FieldBlackoutDate | null {
    
    return blackoutDates.find(blackout => {
      if (blackout.field_id !== fieldId) return false;
      
      // Check if date falls within blackout range
      return blackout.start_date <= date && blackout.end_date >= date;
    }) || null;
  }

  /**
   * Check for reservation conflicts
   */
  private static checkReservationConflict(
    fieldId: string,
    date: string,
    reservations: Reservation[]
  ): Reservation | null {
    
    return reservations.find(reservation => {
      if (reservation.field_id !== fieldId) return false;
      if (reservation.status === 'cancelled' || reservation.status === 'rejected') return false;
      
      // Check if date matches reservation date
      const reservationDate = new Date(reservation.start_time).toISOString().split('T')[0];
      return reservationDate === date;
    }) || null;
  }

  /**
   * Check for time slot conflicts
   */
  private static checkTimeSlotConflict(
    fieldId: string,
    date: string,
    startTime: string,
    endTime: string,
    reservations: Reservation[] = [],
    blackoutDates: FieldBlackoutDate[] = []
  ): { type: 'blackout' | 'reservation', details: any } | null {
    
    // Check blackout conflicts
    const blackoutConflict = blackoutDates.find(blackout => {
      if (blackout.field_id !== fieldId) return false;
      if (blackout.start_date > date || blackout.end_date < date) return false;
      
      // If blackout has specific times, check time overlap
      if (blackout.start_time && blackout.end_time) {
        return this.timeRangesOverlap(
          startTime, endTime,
          blackout.start_time, blackout.end_time
        );
      }
      
      // If no specific times, it's a full-day blackout
      return true;
    });
    
    if (blackoutConflict) {
      return {
        type: 'blackout',
        details: blackoutConflict
      };
    }
    
    // Check reservation conflicts
    const reservationConflict = reservations.find(reservation => {
      if (reservation.field_id !== fieldId) return false;
      if (reservation.status === 'cancelled' || reservation.status === 'rejected') return false;
      
      const reservationDate = new Date(reservation.start_time).toISOString().split('T')[0];
      if (reservationDate !== date) return false;
      
      // Check time overlap
      const resStartTime = new Date(reservation.start_time).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const resEndTime = new Date(reservation.end_time).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return this.timeRangesOverlap(startTime, endTime, resStartTime, resEndTime);
    });
    
    if (reservationConflict) {
      return {
        type: 'reservation',
        details: reservationConflict
      };
    }
    
    return null;
  }

  /**
   * Check if two time ranges overlap
   */
  private static timeRangesOverlap(
    start1: string, end1: string,
    start2: string, end2: string
  ): boolean {
    const [start1Hour, start1Min] = start1.split(':').map(Number);
    const [end1Hour, end1Min] = end1.split(':').map(Number);
    const [start2Hour, start2Min] = start2.split(':').map(Number);
    const [end2Hour, end2Min] = end2.split(':').map(Number);
    
    const start1Minutes = start1Hour * 60 + start1Min;
    const end1Minutes = end1Hour * 60 + end1Min;
    const start2Minutes = start2Hour * 60 + start2Min;
    const end2Minutes = end2Hour * 60 + end2Min;
    
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  /**
   * Format availability message for UI
   */
  static formatAvailabilityMessage(availability: AvailabilityCheck): string {
    if (availability.isAvailable) {
      return 'Available for booking';
    }
    
    switch (availability.conflictType) {
      case 'blackout':
        return `Unavailable: ${availability.conflictDetails?.reason || 'Blocked period'}`;
      case 'reservation':
        return `Already reserved by ${availability.conflictDetails?.name || 'another customer'}`;
      case 'maintenance':
        return 'Unavailable: Field maintenance in progress';
      default:
        return availability.reason || 'Not available';
    }
  }

  /**
   * Get availability summary for a date range
   */
  static getAvailabilitySummary(
    field: Field,
    dateRange: AvailabilityCheck[]
  ): {
    totalDays: number;
    availableDays: number;
    unavailableDays: number;
    blackoutDays: number;
    reservedDays: number;
    maintenanceDays: number;
  } {
    
    return {
      totalDays: dateRange.length,
      availableDays: dateRange.filter(d => d.isAvailable).length,
      unavailableDays: dateRange.filter(d => !d.isAvailable).length,
      blackoutDays: dateRange.filter(d => d.conflictType === 'blackout').length,
      reservedDays: dateRange.filter(d => d.conflictType === 'reservation').length,
      maintenanceDays: dateRange.filter(d => d.conflictType === 'maintenance').length
    };
  }
} 