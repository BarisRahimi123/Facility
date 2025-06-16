import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  
  // Redirect to the standalone report page
  return NextResponse.redirect(new URL(`/report/${token}`, request.url));
} 