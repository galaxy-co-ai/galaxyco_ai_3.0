/**
 * Calendar Sync API
 * 
 * POST /api/crm/calendar/sync - Trigger calendar sync
 * GET /api/crm/calendar/sync - Check sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { syncCalendarEvents, getConnectedCalendars } from '@/lib/integrations/calendar-sync';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

// GET: Check sync status/connected providers
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Calendar Sync API GET');
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

    const providers = await getConnectedCalendars(orgId);
    const anyConnected = providers.some(p => p.connected);

    return NextResponse.json({
      available: anyConnected,
      providers,
    });
  } catch (error) {
    return createErrorResponse(error, 'Calendar Sync API GET');
  }
}

// POST: Trigger calendar sync
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Calendar Sync API POST');
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

    const body = await request.json().catch(() => ({}));
    const {
      provider,
      startDate,
      endDate,
      maxResults = 100,
    } = body;

    const results = await syncCalendarEvents(orgId, {
      provider,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      maxResults,
    });

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const allErrors = results.flatMap(r => r.errors);

    logger.info('[Calendar Sync API] Sync completed', {
      workspaceId: orgId,
      userId,
      totalSynced,
      providers: results.map(r => ({ provider: r.provider, synced: r.synced })),
    });

    return NextResponse.json({
      success: results.every(r => r.success),
      synced: totalSynced,
      results,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    return createErrorResponse(error, 'Calendar Sync API POST');
  }
}
