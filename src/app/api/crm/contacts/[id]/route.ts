import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { broadcastActivity } from '@/lib/pusher-server';

const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  lastContactedAt: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: contactId } = await params;

    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, workspaceId)
      ),
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    return createErrorResponse(error, 'Get contact error');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: contactId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateContactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if contact exists and belongs to workspace
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    // Update contact
    const [updated] = await db
      .update(contacts)
      .set({
        ...data,
        lastContactedAt: data.lastContactedAt ? new Date(data.lastContactedAt) : undefined,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, workspaceId)
      ))
      .returning();

    // Invalidate cache
    await invalidateCRMCache(userId);

    // Broadcast real-time event (non-blocking)
    broadcastActivity(workspaceId, {
      id: updated.id,
      type: 'contact:updated',
      title: 'Contact updated',
      description: `${updated.firstName} ${updated.lastName || ''} was updated`,
      entityType: 'contact',
      entityId: updated.id,
      userId,
    }).catch(err => {
      logger.error('Broadcast failed (non-critical)', err);
    });

    return NextResponse.json(updated);
  } catch (error) {
    return createErrorResponse(error, 'Update contact error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: contactId } = await params;

    // Check if contact exists
    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Delete contact
    await db
      .delete(contacts)
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.workspaceId, workspaceId)
      ));

    // Invalidate cache
    await invalidateCRMCache(userId);

    // Broadcast real-time event (non-blocking)
    broadcastActivity(workspaceId, {
      id: contactId,
      type: 'contact:deleted',
      title: 'Contact deleted',
      description: `${existing.firstName} ${existing.lastName || ''} was removed`,
      entityType: 'contact',
      entityId: contactId,
      userId,
    }).catch(err => {
      logger.error('Broadcast failed (non-critical)', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete contact error');
  }
}


