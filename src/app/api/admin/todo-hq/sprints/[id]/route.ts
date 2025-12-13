/**
 * To-Do HQ Sprint Detail API
 * GET /api/admin/todo-hq/sprints/[id] - Get sprint with all tasks
 * PUT /api/admin/todo-hq/sprints/[id] - Update sprint
 * DELETE /api/admin/todo-hq/sprints/[id] - Delete sprint (tasks become unassigned)
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { todoHqSprints, todoHqTasks, todoHqEpics } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const updateSprintSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  goal: z.string().nullable().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  color: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: sprintId } = await params;

    // Get the sprint
    const sprint = await db.query.todoHqSprints.findFirst({
      where: and(
        eq(todoHqSprints.id, sprintId),
        eq(todoHqSprints.workspaceId, workspaceId)
      ),
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Get all tasks for this sprint with their epic info
    const tasks = await db
      .select({
        id: todoHqTasks.id,
        title: todoHqTasks.title,
        description: todoHqTasks.description,
        status: todoHqTasks.status,
        priority: todoHqTasks.priority,
        sortOrder: todoHqTasks.sortOrder,
        tags: todoHqTasks.tags,
        notes: todoHqTasks.notes,
        dueDate: todoHqTasks.dueDate,
        completedAt: todoHqTasks.completedAt,
        epicId: todoHqTasks.epicId,
        sprintId: todoHqTasks.sprintId,
        epicName: todoHqEpics.name,
      })
      .from(todoHqTasks)
      .leftJoin(todoHqEpics, eq(todoHqTasks.epicId, todoHqEpics.id))
      .where(
        and(
          eq(todoHqTasks.workspaceId, workspaceId),
          eq(todoHqTasks.sprintId, sprintId)
        )
      )
      .orderBy(todoHqTasks.sortOrder);

    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;

    return NextResponse.json({
      sprint: {
        ...sprint,
        taskCount: total,
        completedTaskCount: done,
        completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
      },
      tasks,
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch sprint');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: sprintId } = await params;
    const body = await request.json();

    const validatedData = updateSprintSchema.parse(body);

    // Check sprint exists
    const existingSprint = await db.query.todoHqSprints.findFirst({
      where: and(
        eq(todoHqSprints.id, sprintId),
        eq(todoHqSprints.workspaceId, workspaceId)
      ),
    });

    if (!existingSprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.goal !== undefined) updateData.goal = validatedData.goal;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null;
    }
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder;
    if (validatedData.color !== undefined) updateData.color = validatedData.color;

    const [updatedSprint] = await db
      .update(todoHqSprints)
      .set(updateData)
      .where(
        and(
          eq(todoHqSprints.id, sprintId),
          eq(todoHqSprints.workspaceId, workspaceId)
        )
      )
      .returning();

    logger.info('Updated sprint', { sprintId, changes: Object.keys(validatedData) });

    return NextResponse.json({ sprint: updatedSprint });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return createErrorResponse(error, 'Failed to update sprint');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: sprintId } = await params;

    // Check sprint exists
    const existingSprint = await db.query.todoHqSprints.findFirst({
      where: and(
        eq(todoHqSprints.id, sprintId),
        eq(todoHqSprints.workspaceId, workspaceId)
      ),
    });

    if (!existingSprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Tasks will have sprintId set to null due to ON DELETE SET NULL

    await db
      .delete(todoHqSprints)
      .where(
        and(
          eq(todoHqSprints.id, sprintId),
          eq(todoHqSprints.workspaceId, workspaceId)
        )
      );

    logger.info('Deleted sprint', { sprintId, name: existingSprint.name });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Failed to delete sprint');
  }
}
