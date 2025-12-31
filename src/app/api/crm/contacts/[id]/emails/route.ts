/**
 * Contact Emails API
 * 
 * GET /api/crm/contacts/[id]/emails - Get emails for a contact
 * POST /api/crm/contacts/[id]/emails/sync - Trigger sync for a contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { contacts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getContactEmails, syncEmails, isEmailSyncAvailable } from '@/lib/integrations/email-sync';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';
import { ContactEmailSyncSchema } from '@/lib/validation/schemas';

// GET: List emails for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Contact Emails API GET');
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

    const { id: contactId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify contact exists and belongs to workspace
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, orgId)
      ),
    });

    if (!contact) {
      return createErrorResponse(new Error('Contact not found'), 'Contact Emails API GET');
    }

    // Get emails
    const result = await getContactEmails(orgId, contactId, { limit, offset });

    // Check sync availability
    const syncStatus = await isEmailSyncAvailable(orgId);

    return NextResponse.json({
      ...result,
      syncAvailable: syncStatus,
      contactEmail: contact.email,
    });
  } catch (error) {
    return createErrorResponse(error, 'Contact Emails API GET');
  }
}

// POST: Trigger email sync for a contact
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Contact Emails API POST');
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

    const { id: contactId } = await params;
    const body = await request.json().catch(() => ({}));
    const validation = ContactEmailSyncSchema.safeParse(body);
    if (!validation.success) {
      return createErrorResponse(new Error(validation.error.errors[0]?.message || 'Validation failed'), 'Contact Emails API POST');
    }
    const { provider, maxResults } = validation.data;

    // Verify contact exists and belongs to workspace
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, orgId)
      ),
    });

    if (!contact) {
      return createErrorResponse(new Error('Contact not found'), 'Contact Emails API POST');
    }

    // Sync emails for this contact
    const results = await syncEmails(orgId, {
      provider,
      maxResults,
      contactEmail: contact.email,
      afterDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
    });

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const allErrors = results.flatMap(r => r.errors);

    logger.info('[Contact Emails API] Sync completed', {
      contactId,
      workspaceId: orgId,
      totalSynced,
      providers: results.map(r => r.provider),
    });

    return NextResponse.json({
      success: results.every(r => r.success),
      synced: totalSynced,
      results,
      errors: allErrors.length > 0 ? allErrors : undefined,
    });
  } catch (error) {
    return createErrorResponse(error, 'Contact Emails API POST');
  }
}
