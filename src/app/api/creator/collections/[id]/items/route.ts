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
      return createErrorResponse(new Error('Collection not found'), 'Add Item to Collection');
    }

    const body = await request.json();
    const validationResult = ItemActionSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(new Error(validationResult.error.errors[0]?.message || 'Validation failed - invalid input'), 'Add Item to Collection');
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
      return createErrorResponse(new Error('Item not found'), 'Add Item to Collection');
    }

    // Check if already in collection
    const existing = await db.query.creatorItemCollections.findFirst({
      where: and(
        eq(creatorItemCollections.itemId, itemId),
        eq(creatorItemCollections.collectionId, collectionId)
      ),
    });

    if (existing) {
      return createErrorResponse(new Error('Item already in collection'), 'Add Item to Collection');
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
      return createErrorResponse(new Error('Item ID is required'), 'Remove Item from Collection');
    }

    // Verify collection exists and belongs to workspace
    const collection = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.id, collectionId),
        eq(creatorCollections.workspaceId, workspaceId)
      ),
    });

    if (!collection) {
      return createErrorResponse(new Error('Collection not found'), 'Remove Item from Collection');
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
