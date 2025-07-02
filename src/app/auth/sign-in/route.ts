import { NextRequest, NextResponse } from 'next/server';

// Handle GET requests
export async function GET(request: NextRequest) {
  console.log('Server-side route handler for /auth/sign-in (GET)');
  
  // Redirect to the simple sign-in page
  return NextResponse.redirect(new URL('/auth/sign-in-simple', request.url));
}

// Handle HEAD requests
export async function HEAD(request: NextRequest) {
  console.log('Server-side route handler for /auth/sign-in (HEAD)');
  // For HEAD requests, just return a 200 OK
  return new NextResponse(null, { status: 200 });
}

// Handle POST requests (in case form submissions are attempted)
export async function POST(request: NextRequest) {
  console.log('Server-side route handler for /auth/sign-in (POST)');
  // Redirect POST requests as well
  return NextResponse.redirect(new URL('/auth/sign-in-simple', request.url));
} 