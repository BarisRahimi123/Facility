import { NextResponse } from 'next/server';

// API health check endpoint
export function GET() {
  return NextResponse.json(
    { 
      success: true, 
      message: 'Fieldwire API is running',
      timestamp: new Date().toISOString()
    },
    { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
} 