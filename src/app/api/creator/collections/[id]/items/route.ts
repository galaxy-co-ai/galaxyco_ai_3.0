/**
 * Creator Collection Items API
 * 
 * POST /api/creator/collections/[id]/items - Add item to collection
 * DELETE /api/creator/collections/[id]/items - Remove item from collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { creatorCollections, creatorItemCollections, creatorItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

const ItemActionSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: collectionId } = await params;

    // Verify collection exists and belongs to workspace
    const collection = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.id, collectionId),
        eq(creatorCollections.workspaceId, workspaceId)
      ),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = ItemActionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { itemId } = validationResult.data;

    // Verify item exists and belongs to workspace
    const item = await db.query.creatorItems.findFirst({
      where: and(
        eq(creatorItems.id, itemId),
        eq(creatorItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if already in collection
    const existing = await db.query.creatorItemCollections.findFirst({
      where: and(
        eq(creatorItemCollections.itemId, itemId),
        eq(creatorItemCollections.collectionId, collectionId)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: 'Item already in collection' }, { status: 409 });
    }

    // Add item to collection
    await db.insert(creatorItemCollections).values({
      itemId,
      collectionId,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Add Item to Collection error');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Verify collection exists and belongs to workspace
    const collection = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.id, collectionId),
        eq(creatorCollections.workspaceId, workspaceId)
      ),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Remove item from collection
    await db
      .delete(creatorItemCollections)
      .where(and(
        eq(creatorItemCollections.itemId, itemId),
        eq(creatorItemCollections.collectionId, collectionId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Remove Item from Collection error');
  }
}
