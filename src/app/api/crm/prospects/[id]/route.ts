import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for updating a prospect/lead
const updateProspectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  company: z.string().max(255).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  estimatedValue: z.number().min(0).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: prospectId } = await params;

    const body = await request.json();
    const validationResult = updateProspectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    logger.info('Updating prospect', { prospectId, workspaceId, userId });

    // Check if prospect exists and belongs to workspace
    const existing = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.stage !== undefined) updateData.stage = data.stage;
    if (data.estimatedValue !== undefined) updateData.estimatedValue = data.estimatedValue;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;

    // Update prospect
    const [updated] = await db
      .update(prospects)
      .set(updateData)
      .where(and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ))
      .returning();

    logger.info('Prospect updated successfully', { prospectId, workspaceId });

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json(updated);
  } catch (error) {
    return createErrorResponse(error, 'Update prospect error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: prospectId } = await params;

    logger.info('Deleting prospect', { prospectId, workspaceId, userId });

    // Check if prospect exists and belongs to workspace
    const existing = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Delete prospect
    await db
      .delete(prospects)
      .where(and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ));

    logger.info('Prospect deleted successfully', { prospectId, workspaceId });

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete prospect error');
  }
}







