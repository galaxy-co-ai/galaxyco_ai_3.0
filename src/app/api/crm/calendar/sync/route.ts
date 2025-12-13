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

// GET: Check sync status/connected providers
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await getConnectedCalendars(orgId);
    const anyConnected = providers.some(p => p.connected);

    return NextResponse.json({
      available: anyConnected,
      providers,
    });
  } catch (error) {
    logger.error('[Calendar Sync API] GET error', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}

// POST: Trigger calendar sync
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    logger.error('[Calendar Sync API] POST error', error);
    return NextResponse.json(
      { error: 'Failed to sync calendar' },
      { status: 500 }
    );
  }
}
