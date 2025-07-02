import { NextRequest, NextResponse } from 'next/server';
import { createReservation, getReservations, approveReservation, rejectReservation } from '@/app/actions/fields';
import { CreateReservationRequest } from '@/types/field';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'field_id',
      'start_time', 
      'end_time',
      'renter_name',
      'renter_email',
      'purpose_of_use',
      'emergency_contact_name',
      'emergency_contact_phone'
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate date format
    const startTime = new Date(body.start_time);
    const endTime = new Date(body.end_time);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid date format for start_time or end_time' 
        },
        { status: 400 }
      );
    }

    // Validate that end time is after start time
    if (endTime <= startTime) {
      return NextResponse.json(
        { 
          success: false,
          error: 'End time must be after start time' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.renter_email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format' 
        },
        { status: 400 }
      );
    }

    // Create the reservation
    const reservationData: CreateReservationRequest = {
      field_id: body.field_id,
      start_time: body.start_time,
      end_time: body.end_time,
      booking_type: body.booking_type || 'hourly',
      repeat_pattern: body.repeat_pattern || 'none',
      repeat_until: body.repeat_until || null,
      renter_name: body.renter_name,
      renter_email: body.renter_email,
      renter_phone: body.renter_phone || null,
      organization_name: body.organization_name || null,
      purpose_of_use: body.purpose_of_use,
      estimated_attendees: body.estimated_attendees || null,
      special_requests: body.special_requests || null,
      emergency_contact_name: body.emergency_contact_name,
      emergency_contact_phone: body.emergency_contact_phone,
    };

    const reservation = await createReservation(reservationData);

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation created successfully'
    });

  } catch (error: any) {
    console.error('Error creating reservation:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create reservation' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facility_id');

    const reservations = await getReservations(facilityId || undefined);

    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    });

  } catch (error: any) {
    console.error('Error fetching reservations:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch reservations' 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, action, approvedBy, reason } = body;

    if (!reservationId || !action || !approvedBy) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: reservationId, action, and approvedBy are required' 
        },
        { status: 400 }
      );
    }

    let reservation;

    if (action === 'approve') {
      reservation = await approveReservation(reservationId, approvedBy);
    } else if (action === 'reject') {
      reservation = await rejectReservation(reservationId, approvedBy, reason);
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: `Reservation ${action}d successfully`
    });

  } catch (error: any) {
    console.error('Error updating reservation:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update reservation' 
      },
      { status: 500 }
    );
  }
} 