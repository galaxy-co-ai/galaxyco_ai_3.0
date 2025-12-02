/**
 * Dashboard v2 API Route - Test Version
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'Dashboard v2 API is working!',
    timestamp: new Date().toISOString()
  });
}
