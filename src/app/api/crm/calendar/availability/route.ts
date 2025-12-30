/**
 * Calendar Availability API
 * 
 * GET /api/crm/calendar/availability - Get available time slots
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAvailableTimeSlots } from '@/lib/integrations/calendar-sync';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

// GET: Find available time slots
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Calendar Availability API');
    }

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
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
    return createErrorResponse(error, 'Calendar Availability API GET');
  }
}
