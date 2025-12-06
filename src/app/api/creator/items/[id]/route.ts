/**
 * Creator Item API (Single Item)
 * 
 * GET /api/creator/items/[id] - Get single item
 * PUT /api/creator/items/[id] - Update item
 * DELETE /api/creator/items/[id] - Delete item
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { creatorItems, creatorItemCollections, creatorCollections } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for updating an item
const UpdateItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.object({
    sections: z.array(z.object({
      id: z.string(),
      type: z.enum(['title', 'heading', 'paragraph', 'list', 'cta']),
      content: z.string(),
      editable: z.boolean(),
    })),
  }).optional(),
  metadata: z.record(z.string()).optional(),
  starred: z.boolean().optional(),
  gammaUrl: z.string().nullable().optional(),
  gammaEditUrl: z.string().nullable().optional(),
  collectionIds: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const item = await db.query.creatorItems.findFirst({
      where: and(
        eq(creatorItems.id, id),
        eq(creatorItems.workspaceId, workspaceId)
      ),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get collection IDs
    const itemCollections = await db
      .select({ collectionId: creatorItemCollections.collectionId })
      .from(creatorItemCollections)
      .where(eq(creatorItemCollections.itemId, id));

    const itemUser = Array.isArray(item.user) ? item.user[0] : item.user;

    return NextResponse.json({
      item: {
        id: item.id,
        title: item.title,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        starred: item.starred,
        gammaUrl: item.gammaUrl,
        gammaEditUrl: item.gammaEditUrl,
        collectionIds: itemCollections.map(c => c.collectionId),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdBy: itemUser
          ? itemUser.firstName && itemUser.lastName
            ? `${itemUser.firstName} ${itemUser.lastName}`
            : itemUser.email
          : 'User',
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Item GET error');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Check item exists and belongs to workspace
    const existingItem = await db.query.creatorItems.findFirst({
      where: and(
        eq(creatorItems.id, id),
        eq(creatorItems.workspaceId, workspaceId)
      ),
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = UpdateItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { title, content, metadata, starred, gammaUrl, gammaEditUrl, collectionIds } = validationResult.data;

    // Build update object (only include fields that are provided)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (starred !== undefined) updateData.starred = starred;
    if (gammaUrl !== undefined) updateData.gammaUrl = gammaUrl;
    if (gammaEditUrl !== undefined) updateData.gammaEditUrl = gammaEditUrl;

    // Update the item
    const [updatedItem] = await db
      .update(creatorItems)
      .set(updateData)
      .where(and(
        eq(creatorItems.id, id),
        eq(creatorItems.workspaceId, workspaceId)
      ))
      .returning();

    // Update collection associations if provided
    if (collectionIds !== undefined) {
      // Remove existing associations
      await db
        .delete(creatorItemCollections)
        .where(eq(creatorItemCollections.itemId, id));

      // Add new associations
      if (collectionIds.length > 0) {
        // Verify collections belong to workspace
        const validCollections = await db
          .select({ id: creatorCollections.id })
          .from(creatorCollections)
          .where(and(
            eq(creatorCollections.workspaceId, workspaceId),
            inArray(creatorCollections.id, collectionIds)
          ));

        const validCollectionIds = validCollections.map(c => c.id);

        if (validCollectionIds.length > 0) {
          await db.insert(creatorItemCollections).values(
            validCollectionIds.map(collectionId => ({
              itemId: id,
              collectionId,
            }))
          );
        }
      }
    }

    // Get updated collection IDs
    const itemCollections = await db
      .select({ collectionId: creatorItemCollections.collectionId })
      .from(creatorItemCollections)
      .where(eq(creatorItemCollections.itemId, id));

    return NextResponse.json({
      item: {
        ...updatedItem,
        collectionIds: itemCollections.map(c => c.collectionId),
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Item PUT error');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Check item exists and belongs to workspace
    const existingItem = await db.query.creatorItems.findFirst({
      where: and(
        eq(creatorItems.id, id),
        eq(creatorItems.workspaceId, workspaceId)
      ),
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Delete the item (cascade will handle creatorItemCollections)
    await db
      .delete(creatorItems)
      .where(and(
        eq(creatorItems.id, id),
        eq(creatorItems.workspaceId, workspaceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Creator Item DELETE error');
  }
}
