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
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

// GET: Check sync status/availability
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Email sync status check');
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
    return createErrorResponse(error, 'Email sync status check error');
  }
}

// POST: Trigger email sync
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Email sync');
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
    return createErrorResponse(error, 'Email sync error');
  }
}
