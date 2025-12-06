/**
 * Creator Collections API
 * 
 * GET /api/creator/collections - List collections with item counts
 * POST /api/creator/collections - Create collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { creatorCollections, creatorItems, creatorItemCollections } from '@/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for creating a collection
const CreateCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  isAuto: z.boolean().optional(),
});

// Type icons for auto collections
const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  documents: { icon: 'FileText', color: 'text-blue-600' },
  images: { icon: 'Image', color: 'text-pink-600' },
  newsletters: { icon: 'Mail', color: 'text-amber-600' },
  blogs: { icon: 'PenLine', color: 'text-emerald-600' },
  social: { icon: 'MessageSquare', color: 'text-cyan-600' },
  proposals: { icon: 'Briefcase', color: 'text-purple-600' },
  presentations: { icon: 'Presentation', color: 'text-indigo-600' },
};

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get user-defined collections with item counts
    const userCollections = await db.query.creatorCollections.findMany({
      where: eq(creatorCollections.workspaceId, workspaceId),
      orderBy: [desc(creatorCollections.createdAt)],
    });

    // Get item counts per collection
    const collectionCounts = await db
      .select({
        collectionId: creatorItemCollections.collectionId,
        count: count(creatorItemCollections.itemId),
      })
      .from(creatorItemCollections)
      .groupBy(creatorItemCollections.collectionId);

    const countsMap = collectionCounts.reduce((acc, row) => {
      acc[row.collectionId] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get total items count for "All Creations"
    const totalItemsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorItems)
      .where(eq(creatorItems.workspaceId, workspaceId));
    
    const totalItems = totalItemsResult[0]?.count || 0;

    // Get counts by type for auto-organized collections
    const typeCounts = await db
      .select({
        type: creatorItems.type,
        count: count(creatorItems.id),
      })
      .from(creatorItems)
      .where(eq(creatorItems.workspaceId, workspaceId))
      .groupBy(creatorItems.type);

    const typeCountsMap = typeCounts.reduce((acc, row) => {
      acc[row.type] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Build auto collections (one per type that has items)
    const autoCollections = Object.entries(typeCountsMap).map(([type, itemCount]) => {
      const typeConfig = TYPE_ICONS[type] || TYPE_ICONS['documents'];
      return {
        id: `auto-${type}`,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        description: null,
        color: typeConfig.color,
        icon: typeConfig.icon,
        isAuto: true,
        itemCount,
        type, // The type filter to use
        createdAt: null,
      };
    });

    // Format user collections
    const formattedUserCollections = userCollections.map(col => ({
      id: col.id,
      name: col.name,
      description: col.description,
      color: col.color || 'text-gray-600',
      icon: 'Folder',
      isAuto: col.isAuto,
      itemCount: countsMap[col.id] || 0,
      type: null,
      createdAt: col.createdAt,
    }));

    // Add "All Creations" as first item
    const allCreations = {
      id: 'all',
      name: 'All Creations',
      description: null,
      color: 'text-gray-600',
      icon: 'Grid3X3',
      isAuto: false,
      itemCount: totalItems,
      type: null,
      createdAt: null,
    };

    return NextResponse.json({
      collections: [
        allCreations,
        ...autoCollections,
        ...formattedUserCollections,
      ],
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Collections GET error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const body = await request.json();
    const validationResult = CreateCollectionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, description, color, isAuto } = validationResult.data;

    // Check for duplicate name in workspace
    const existing = await db.query.creatorCollections.findFirst({
      where: and(
        eq(creatorCollections.workspaceId, workspaceId),
        eq(creatorCollections.name, name)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A collection with this name already exists' },
        { status: 409 }
      );
    }

    // Create the collection
    const [newCollection] = await db
      .insert(creatorCollections)
      .values({
        workspaceId,
        name,
        description: description || null,
        color: color || null,
        isAuto: isAuto || false,
      })
      .returning();

    return NextResponse.json({
      collection: {
        id: newCollection.id,
        name: newCollection.name,
        description: newCollection.description,
        color: newCollection.color || 'text-gray-600',
        icon: 'Folder',
        isAuto: newCollection.isAuto,
        itemCount: 0,
        type: null,
        createdAt: newCollection.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Creator Collections POST error');
  }
}
