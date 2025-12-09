import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topicIdeas } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for updating topics
const updateTopicSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  whyItWorks: z.string().max(1000).optional().nullable(),
  status: z.enum(['saved', 'in_progress', 'published', 'archived']).optional(),
  category: z.string().max(100).optional().nullable(),
  suggestedLayout: z.enum(['standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion']).optional().nullable(),
  resultingPostId: z.string().uuid().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single topic
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    const topic = await db.query.topicIdeas.findFirst({
      where: and(
        eq(topicIdeas.id, id),
        eq(topicIdeas.workspaceId, context.workspace.id)
      ),
      with: {
        resultingPost: true,
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(topic);
  } catch (error) {
    logger.error('Failed to fetch topic', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

// PATCH - Update topic
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check topic exists and belongs to workspace
    const existingTopic = await db.query.topicIdeas.findFirst({
      where: and(
        eq(topicIdeas.id, id),
        eq(topicIdeas.workspaceId, context.workspace.id)
      ),
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updateTopicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.whyItWorks !== undefined) updateData.whyItWorks = data.whyItWorks;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.suggestedLayout !== undefined) updateData.suggestedLayout = data.suggestedLayout;
    if (data.resultingPostId !== undefined) updateData.resultingPostId = data.resultingPostId;

    const [updatedTopic] = await db
      .update(topicIdeas)
      .set(updateData)
      .where(eq(topicIdeas.id, id))
      .returning();

    logger.info('Topic idea updated', { 
      topicId: id,
      workspaceId: context.workspace.id 
    });

    return NextResponse.json(updatedTopic);
  } catch (error) {
    logger.error('Failed to update topic', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

// DELETE - Delete topic
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Check topic exists and belongs to workspace
    const existingTopic = await db.query.topicIdeas.findFirst({
      where: and(
        eq(topicIdeas.id, id),
        eq(topicIdeas.workspaceId, context.workspace.id)
      ),
    });

    if (!existingTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    await db
      .delete(topicIdeas)
      .where(eq(topicIdeas.id, id));

    logger.info('Topic idea deleted', { 
      topicId: id,
      workspaceId: context.workspace.id 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete topic', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}

