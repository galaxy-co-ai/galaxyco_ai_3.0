import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getAdminContext } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const updateSchema = z.object({
  status: z.enum(['active', 'archived', 'closed', 'spam']).optional(),
  isStarred: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// GET - Get a single conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    return createErrorResponse(error, 'Get conversation error');
  }
}

// PATCH - Update conversation (archive, star, pin, assign, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const body = await request.json();
    const validated = updateSchema.parse(body);

    // Verify conversation belongs to workspace
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.isStarred !== undefined) updateData.isStarred = validated.isStarred;
    if (validated.isPinned !== undefined) updateData.isPinned = validated.isPinned;
    if (validated.assignedTo !== undefined) updateData.assignedTo = validated.assignedTo;
    if (validated.labels !== undefined) updateData.labels = validated.labels;
    if (validated.tags !== undefined) updateData.tags = validated.tags;

    const [updated] = await db
      .update(conversations)
      .set(updateData)
      .where(and(
        eq(conversations.id, id),
        eq(conversations.workspaceId, workspaceId)
      ))
      .returning();

    logger.info('Conversation updated', {
      conversationId: id,
      workspaceId,
      updates: Object.keys(validated),
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return createErrorResponse(error, 'Update conversation error');
  }
}

// DELETE - Permanently delete conversation (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin
    const { isAdmin } = await getAdminContext();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Verify conversation belongs to workspace
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, id),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    await db
      .delete(conversations)
      .where(and(
        eq(conversations.id, id),
        eq(conversations.workspaceId, workspaceId)
      ));

    logger.info('Conversation deleted', {
      conversationId: id,
      workspaceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete conversation error');
  }
}
