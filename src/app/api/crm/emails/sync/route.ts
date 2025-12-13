/**
 * Email Sync API
 * 
 * POST /api/crm/emails/sync - Trigger global email sync for workspace
 * GET /api/crm/emails/sync/status - Check sync availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { syncEmails, isEmailSyncAvailable } from '@/lib/integrations/email-sync';
import { logger } from '@/lib/logger';

// GET: Check sync status/availability
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await isEmailSyncAvailable(orgId);

    return NextResponse.json({
      available: status.google || status.microsoft,
      providers: {
        google: {
          connected: status.google,
          label: 'Gmail',
        },
        microsoft: {
          connected: status.microsoft,
          label: 'Outlook',
        },
      },
    });
  } catch (error) {
    logger.error('[Email Sync API] GET error', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}

// POST: Trigger email sync
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      provider, 
      maxResults = 100, 
      afterDate,
    } = body;

    // Default to last 30 days if no date specified
    const syncAfter = afterDate 
      ? new Date(afterDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const results = await syncEmails(orgId, {
      provider,
      maxResults,
      afterDate: syncAfter,
    });

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const allErrors = results.flatMap(r => r.errors);

    logger.info('[Email Sync API] Sync completed', {
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
    logger.error('[Email Sync API] POST error', error);
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
