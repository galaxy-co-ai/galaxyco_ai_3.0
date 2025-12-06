/**
 * Creator Collection API (Single Collection)
 * 
 * GET /api/creator/collections/[id] - Get single collection with items
 * PUT /api/creator/collections/[id] - Update collection
 * DELETE /api/creator/collections/[id] - Delete collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { creatorCollections, creatorItemCollections, creatorItems } from '@/db/schema';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for updating a collection
const UpdateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const collection = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.id, id),
        eq(creatorCollections.workspaceId, workspaceId)
      ),
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Get items in this collection
    const itemMappings = await db
      .select({ itemId: creatorItemCollections.itemId })
      .from(creatorItemCollections)
      .where(eq(creatorItemCollections.collectionId, id));

    const itemIds = itemMappings.map(m => m.itemId);

    let items: typeof creatorItems.$inferSelect[] = [];
    if (itemIds.length > 0) {
      items = await db.query.creatorItems.findMany({
        where: and(
          eq(creatorItems.workspaceId, workspaceId),
          inArray(creatorItems.id, itemIds)
        ),
        orderBy: [desc(creatorItems.createdAt)],
      });
    }

    return NextResponse.json({
      collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        color: collection.color || 'text-gray-600',
        icon: 'Folder',
        isAuto: collection.isAuto,
        itemCount: items.length,
        createdAt: collection.createdAt,
      },
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        starred: item.starred,
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Collection GET error');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Check collection exists and belongs to workspace
    const existingCollection = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.id, id),
        eq(creatorCollections.workspaceId, workspaceId)
      ),
    });

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateCollectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, description, color } = validationResult.data;

    // Check for duplicate name if name is being changed
    if (name && name !== existingCollection.name) {
      const duplicate = await db.query.creatorCollections.findFirst({
        where: and(
          eq(creatorCollections.workspaceId, workspaceId),
          eq(creatorCollections.name, name)
        ),
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A collection with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;

    // Update the collection
    const [updatedCollection] = await db
      .update(creatorCollections)
      .set(updateData)
      .where(and(
        eq(creatorCollections.id, id),
        eq(creatorCollections.workspaceId, workspaceId)
      ))
      .returning();

    // Get item count
    const countResult = await db
      .select({ count: count(creatorItemCollections.itemId) })
      .from(creatorItemCollections)
      .where(eq(creatorItemCollections.collectionId, id));

    return NextResponse.json({
      collection: {
        id: updatedCollection.id,
        name: updatedCollection.name,
        description: updatedCollection.description,
        color: updatedCollection.color || 'text-gray-600',
        icon: 'Folder',
        isAuto: updatedCollection.isAuto,
        itemCount: Number(countResult[0]?.count) || 0,
        createdAt: updatedCollection.createdAt,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Collection PUT error');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Check collection exists and belongs to workspace
    const existingCollection = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.id, id),
        eq(creatorCollections.workspaceId, workspaceId)
      ),
    });

    if (!existingCollection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Delete the collection (cascade will handle creatorItemCollections)
    await db
      .delete(creatorCollections)
      .where(and(
        eq(creatorCollections.id, id),
        eq(creatorCollections.workspaceId, workspaceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Creator Collection DELETE error');
  }
}
