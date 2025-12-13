import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeItemVersions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// GET - List all versions of a document
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: itemId } = await params;

    // Verify item exists and belongs to workspace
    const item = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get all versions
    const versions = await db.query.knowledgeItemVersions.findMany({
      where: eq(knowledgeItemVersions.itemId, itemId),
      orderBy: [desc(knowledgeItemVersions.version)],
      with: {
        changedByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      itemId,
      currentTitle: item.title,
      versionsCount: versions.length,
      versions: versions.map((v) => {
        const user = Array.isArray(v.changedByUser)
          ? v.changedByUser[0]
          : v.changedByUser;
        return {
          id: v.id,
          version: v.version,
          title: v.title,
          summary: v.summary,
          changeDescription: v.changeDescription,
          changedBy: user
            ? user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email
            : 'Unknown',
          changedByUserId: v.changedBy,
          wordCount: v.metadata?.wordCount,
          characterDiff: v.metadata?.characterDiff,
          createdAt: v.createdAt,
        };
      }),
    });
  } catch (error) {
    logger.error('[Knowledge Versions] Error fetching versions', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new version (typically called when updating a document)
// ============================================================================

const createVersionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  summary: z.string().optional(),
  changeDescription: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: itemId } = await params;

    const body = await request.json();

    // Validate input
    const validationResult = createVersionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, content, summary, changeDescription } = validationResult.data;

    // Verify item exists and belongs to workspace
    const item = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get the latest version number
    const latestVersion = await db.query.knowledgeItemVersions.findFirst({
      where: eq(knowledgeItemVersions.itemId, itemId),
      orderBy: [desc(knowledgeItemVersions.version)],
    });

    const newVersionNumber = (latestVersion?.version || 0) + 1;

    // Calculate character diff if we have both old and new content
    const oldContent = item.content || '';
    const newContent = content || '';
    const characterDiff = newContent.length - oldContent.length;

    // Create version record (snapshot of current state BEFORE update)
    const [version] = await db
      .insert(knowledgeItemVersions)
      .values({
        itemId,
        version: newVersionNumber,
        title: item.title, // Store the PREVIOUS title
        content: item.content, // Store the PREVIOUS content
        summary: item.summary,
        changeDescription: changeDescription || `Updated to version ${newVersionNumber}`,
        changedBy: user.id,
        metadata: {
          wordCount: (item.content || '').split(/\s+/).filter(Boolean).length,
          characterDiff,
          previousVersionId: latestVersion?.id,
        },
      })
      .returning();

    // Update the document with new content
    await db
      .update(knowledgeItems)
      .set({
        title,
        content: content ?? item.content,
        summary: summary ?? item.summary,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeItems.id, itemId));

    logger.info('[Knowledge Versions] Created version', {
      itemId,
      version: newVersionNumber,
      userId: user.id,
    });

    return NextResponse.json({
      id: version.id,
      version: version.version,
      title: version.title,
      changeDescription: version.changeDescription,
      createdAt: version.createdAt,
    });
  } catch (error) {
    logger.error('[Knowledge Versions] Error creating version', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
