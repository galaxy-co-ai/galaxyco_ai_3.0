import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topicIdeas } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for creating/updating topics
const topicSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  whyItWorks: z.string().max(1000).optional(),
  generatedBy: z.enum(['ai', 'user']).default('user'),
  status: z.enum(['saved', 'in_progress', 'published', 'archived']).default('saved'),
  category: z.string().max(100).optional(),
  suggestedLayout: z.enum(['standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion']).optional(),
  sourceConversation: z.object({
    sessionId: z.string().optional(),
    keyPoints: z.array(z.string()).optional(),
  }).optional(),
  aiPrompt: z.string().optional(),
});

// GET - List all topics for workspace
export async function GET(request: NextRequest) {
  try {
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

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const generatedBy = searchParams.get('generatedBy');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query conditions
    const conditions = [eq(topicIdeas.workspaceId, context.workspace.id)];
    
    if (status && ['saved', 'in_progress', 'published', 'archived'].includes(status)) {
      conditions.push(eq(topicIdeas.status, status as 'saved' | 'in_progress' | 'published' | 'archived'));
    }
    
    if (generatedBy && ['ai', 'user'].includes(generatedBy)) {
      conditions.push(eq(topicIdeas.generatedBy, generatedBy as 'ai' | 'user'));
    }

    const topics = await db
      .select()
      .from(topicIdeas)
      .where(and(...conditions))
      .orderBy(desc(topicIdeas.createdAt))
      .limit(limit);

    return NextResponse.json({
      topics,
      total: topics.length,
    });
  } catch (error) {
    logger.error('Failed to fetch topics', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST - Create new topic
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const validationResult = topicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the topic
    const [newTopic] = await db
      .insert(topicIdeas)
      .values({
        workspaceId: context.workspace.id,
        title: data.title,
        description: data.description || null,
        whyItWorks: data.whyItWorks || null,
        generatedBy: data.generatedBy,
        status: data.status,
        category: data.category || null,
        suggestedLayout: data.suggestedLayout || null,
        sourceConversation: data.sourceConversation || null,
        aiPrompt: data.aiPrompt || null,
      })
      .returning();

    logger.info('Topic idea created', { 
      topicId: newTopic.id, 
      title: newTopic.title,
      workspaceId: context.workspace.id 
    });

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    logger.error('Failed to create topic', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}

