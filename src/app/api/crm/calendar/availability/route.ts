/**
 * Calendar Availability API
 * 
 * GET /api/crm/calendar/availability - Get available time slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAvailableTimeSlots } from '@/lib/integrations/calendar-sync';
import { logger } from '@/lib/logger';

// GET: Find available time slots
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date();
    
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks ahead
    
    const duration = parseInt(searchParams.get('duration') || '30');
    const workingHoursStart = parseInt(searchParams.get('workingHoursStart') || '9');
    const workingHoursEnd = parseInt(searchParams.get('workingHoursEnd') || '17');
    const excludeWeekends = searchParams.get('excludeWeekends') !== 'false';

    const slots = await getAvailableTimeSlots(orgId, {
      startDate,
      endDate,
      duration,
      workingHoursStart,
      workingHoursEnd,
      excludeWeekends,
    });

    return NextResponse.json({
      slots,
      options: {
        duration,
        workingHoursStart,
        workingHoursEnd,
        excludeWeekends,
      },
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('[Calendar Availability API] GET error', error);
    return NextResponse.json(
      { error: 'Failed to find available slots' },
      { status: 500 }
    );
  }
}
