import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoHqTasks } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schemas
const createTaskSchema = z.object({
  epicId: z.string().uuid('Invalid epic ID'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateTaskSchema = z.object({
  id: z.string().uuid('Invalid task ID'),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  sortOrder: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

// GET - List tasks (optionally filtered by epicId)
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const epicId = searchParams.get('epicId');

    // Build where clause
    const whereClause = epicId
      ? and(
          eq(todoHqTasks.workspaceId, context.workspace.id),
          eq(todoHqTasks.epicId, epicId)
        )
      : eq(todoHqTasks.workspaceId, context.workspace.id);

    // Fetch tasks
    const tasks = await db.query.todoHqTasks.findMany({
      where: whereClause,
      orderBy: (tasks, { asc }) => [asc(tasks.sortOrder), asc(tasks.createdAt)],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    logger.error('Failed to fetch To-Do HQ tasks', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST - Create a new task
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
    const validationResult = createTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the task
    const [task] = await db
      .insert(todoHqTasks)
      .values({
        workspaceId: context.workspace.id,
        createdBy: user.id,
        epicId: data.epicId,
        title: data.title,
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        sortOrder: data.sortOrder || 0,
        tags: data.tags || [],
        notes: data.notes || null,
      })
      .returning();

    logger.info(`Created To-Do HQ task: ${task.id}`, { taskTitle: task.title, epicId: task.epicId, userId: user.id });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create To-Do HQ task', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PATCH - Update an existing task
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
    const validationResult = updateTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { id, dueDate, ...data } = validationResult.data;

    // Build update data
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle dueDate conversion
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Handle completedAt when status changes to done
    if (data.status === 'done') {
      updateData.completedAt = new Date();
    } else if (data.status) {
      updateData.completedAt = null;
    }

    // Update the task
    const [task] = await db
      .update(todoHqTasks)
      .set(updateData)
      .where(
        and(
          eq(todoHqTasks.id, id),
          eq(todoHqTasks.workspaceId, context.workspace.id)
        )
      )
      .returning();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    logger.info(`Updated To-Do HQ task: ${task.id}`, { taskTitle: task.title });

    return NextResponse.json({ task });
  } catch (error) {
    logger.error('Failed to update To-Do HQ task', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
