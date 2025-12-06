/**
 * Creator Items API
 * 
 * GET /api/creator/items - List items with filtering
 * POST /api/creator/items - Create new item
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { creatorItems, creatorItemCollections, creatorCollections } from '@/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for creating an item
const CreateItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  type: z.string().min(1, 'Type is required'),
  content: z.object({
    sections: z.array(z.object({
      id: z.string(),
      type: z.enum(['title', 'heading', 'paragraph', 'list', 'cta']),
      content: z.string(),
      editable: z.boolean(),
    })),
  }),
  metadata: z.record(z.string()).optional(),
  starred: z.boolean().optional(),
  gammaUrl: z.string().optional(),
  gammaEditUrl: z.string().optional(),
  collectionIds: z.array(z.string()).optional(), // Collections to add item to
});

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);
    
    // Filter parameters
    const type = searchParams.get('type');
    const collectionId = searchParams.get('collectionId');
    const starred = searchParams.get('starred');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where conditions
    const whereConditions = [eq(creatorItems.workspaceId, workspaceId)];
    
    if (type && type !== 'all') {
      whereConditions.push(eq(creatorItems.type, type));
    }
    
    if (starred === 'true') {
      whereConditions.push(eq(creatorItems.starred, true));
    }

    // Build additional conditions for collection filter
    if (collectionId && collectionId !== 'all') {
      const itemsInCollection = await db
        .select({ itemId: creatorItemCollections.itemId })
        .from(creatorItemCollections)
        .where(eq(creatorItemCollections.collectionId, collectionId));
      
      const collectionItemIds = itemsInCollection.map(i => i.itemId);
      
      if (collectionItemIds.length === 0) {
        // No items in collection - return early with empty results
        return NextResponse.json({
          items: [],
          pagination: { total: 0, limit, offset, hasMore: false },
        });
      }
      
      whereConditions.push(inArray(creatorItems.id, collectionItemIds));
    }

    // Get items with user relation
    const items = await db.query.creatorItems.findMany({
      where: and(...whereConditions),
      orderBy: [desc(creatorItems.createdAt)],
      limit,
      offset,
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

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorItems)
      .where(and(...whereConditions));
    
    const total = countResult[0]?.count || 0;

    // Get collection IDs for each item
    const itemIds = items.map(item => item.id);
    const itemCollectionMappings = itemIds.length > 0
      ? await db
          .select({
            itemId: creatorItemCollections.itemId,
            collectionId: creatorItemCollections.collectionId,
          })
          .from(creatorItemCollections)
          .where(inArray(creatorItemCollections.itemId, itemIds))
      : [];

    // Group collection IDs by item
    const collectionsByItem = itemCollectionMappings.reduce((acc, mapping) => {
      if (!acc[mapping.itemId]) {
        acc[mapping.itemId] = [];
      }
      acc[mapping.itemId].push(mapping.collectionId);
      return acc;
    }, {} as Record<string, string[]>);

    return NextResponse.json({
      items: items.map(item => {
        const itemUser = Array.isArray(item.user) ? item.user[0] : item.user;
        return {
          id: item.id,
          title: item.title,
          type: item.type,
          content: item.content,
          metadata: item.metadata,
          starred: item.starred,
          gammaUrl: item.gammaUrl,
          gammaEditUrl: item.gammaEditUrl,
          collectionIds: collectionsByItem[item.id] || [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          createdBy: itemUser
            ? itemUser.firstName && itemUser.lastName
              ? `${itemUser.firstName} ${itemUser.lastName}`
              : itemUser.email
            : 'User',
        };
      }),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Items GET error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = CreateItemSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { title, type, content, metadata, starred, gammaUrl, gammaEditUrl, collectionIds } = validationResult.data;

    // Create the item
    const [newItem] = await db
      .insert(creatorItems)
      .values({
        workspaceId,
        userId: user.id,
        title,
        type,
        content,
        metadata: metadata || {},
        starred: starred || false,
        gammaUrl: gammaUrl || null,
        gammaEditUrl: gammaEditUrl || null,
      })
      .returning();

    // Add to collections if specified
    if (collectionIds && collectionIds.length > 0) {
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
            itemId: newItem.id,
            collectionId,
          }))
        );
      }
    }

    return NextResponse.json({
      item: {
        ...newItem,
        collectionIds: collectionIds || [],
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Creator Items POST error');
  }
}
