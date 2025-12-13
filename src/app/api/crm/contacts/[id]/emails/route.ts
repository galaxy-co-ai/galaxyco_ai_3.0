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

// GET: List emails for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
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
    logger.error('[Contact Emails API] GET error', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: contactId } = await params;
    const body = await request.json().catch(() => ({}));
    const { provider, maxResults = 50 } = body;

    // Verify contact exists and belongs to workspace
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, orgId)
      ),
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
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
    logger.error('[Contact Emails API] POST error', error);
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
