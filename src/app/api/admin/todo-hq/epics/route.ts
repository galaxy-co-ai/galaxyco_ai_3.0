import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoHqEpics } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schemas
const createEpicSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  targetCompletionPercent: z.number().min(0).max(100).optional(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const updateEpicSchema = z.object({
  id: z.string().uuid('Invalid epic ID'),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold']).optional(),
  targetCompletionPercent: z.number().min(0).max(100).optional(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// GET - List all epics with task counts and computed completion
export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Fetch all epics with their tasks
    const epics = await db.query.todoHqEpics.findMany({
      where: eq(todoHqEpics.workspaceId, context.workspace.id),
      with: {
        tasks: true,
      },
      orderBy: (epics, { asc }) => [asc(epics.sortOrder), asc(epics.createdAt)],
    });

    // Compute completion percentage for each epic
    const epicsWithCompletion = epics.map((epic) => {
      const tasks = epic.tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Return all tasks for display
      return {
        ...epic,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
        completionPercent,
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          sprintId: t.sprintId,
          tags: t.tags,
          notes: t.notes,
        })),
      };
    });

    return NextResponse.json({ epics: epicsWithCompletion });
  } catch (error) {
    logger.error('Failed to fetch To-Do HQ epics', error);
    return NextResponse.json({ error: 'Failed to fetch epics' }, { status: 500 });
  }
}

// POST - Create a new epic
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get workspace and user context
    let context, user;
    try {
      context = await getCurrentWorkspace();
      user = await getCurrentUser();
    } catch {
      return NextResponse.json({ error: 'Workspace or user not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = createEpicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the epic
    const [epic] = await db
      .insert(todoHqEpics)
      .values({
        workspaceId: context.workspace.id,
        createdBy: user.id,
        name: data.name,
        description: data.description || null,
        status: data.status || 'not_started',
        targetCompletionPercent: data.targetCompletionPercent || 100,
        sortOrder: data.sortOrder || 0,
        tags: data.tags || [],
      })
      .returning();

    logger.info(`Created To-Do HQ epic: ${epic.id}`, { epicName: epic.name, userId: user.id });

    return NextResponse.json({ epic }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create To-Do HQ epic', error);
    return NextResponse.json({ error: 'Failed to create epic' }, { status: 500 });
  }
}

// PATCH - Update an existing epic
export async function PATCH(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validationResult = updateEpicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = validationResult.data;

    // Update the epic
    const [epic] = await db
      .update(todoHqEpics)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(todoHqEpics.id, id),
          eq(todoHqEpics.workspaceId, context.workspace.id)
        )
      )
      .returning();

    if (!epic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    logger.info(`Updated To-Do HQ epic: ${epic.id}`, { epicName: epic.name });

    return NextResponse.json({ epic });
  } catch (error) {
    logger.error('Failed to update To-Do HQ epic', error);
    return NextResponse.json({ error: 'Failed to update epic' }, { status: 500 });
  }
}
