/**
 * To-Do HQ Sprint Task Assignment API
 * POST /api/admin/todo-hq/sprints/[id]/assign - Assign tasks to a sprint
 * DELETE /api/admin/todo-hq/sprints/[id]/assign - Remove tasks from a sprint
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { todoHqSprints, todoHqTasks } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const assignTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'At least one task ID is required'),
});

// Assign tasks to this sprint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: sprintId } = await params;
    const body = await request.json();

    const validatedData = assignTasksSchema.parse(body);

    // Verify sprint exists
    const sprint = await db.query.todoHqSprints.findFirst({
      where: and(
        eq(todoHqSprints.id, sprintId),
        eq(todoHqSprints.workspaceId, workspaceId)
      ),
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Update tasks to assign them to this sprint
    const result = await db
      .update(todoHqTasks)
      .set({
        sprintId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(todoHqTasks.workspaceId, workspaceId),
          inArray(todoHqTasks.id, validatedData.taskIds)
        )
      )
      .returning({ id: todoHqTasks.id });

    logger.info('Assigned tasks to sprint', {
      sprintId,
      sprintName: sprint.name,
      taskCount: result.length,
    });

    return NextResponse.json({
      success: true,
      assignedCount: result.length,
      taskIds: result.map((r) => r.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return createErrorResponse(error, 'Failed to assign tasks to sprint');
  }
}

// Remove tasks from this sprint (move to backlog)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: sprintId } = await params;
    const body = await request.json();

    const validatedData = assignTasksSchema.parse(body);

    // Verify sprint exists
    const sprint = await db.query.todoHqSprints.findFirst({
      where: and(
        eq(todoHqSprints.id, sprintId),
        eq(todoHqSprints.workspaceId, workspaceId)
      ),
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }

    // Remove sprint assignment from tasks (move to backlog)
    const result = await db
      .update(todoHqTasks)
      .set({
        sprintId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(todoHqTasks.workspaceId, workspaceId),
          eq(todoHqTasks.sprintId, sprintId),
          inArray(todoHqTasks.id, validatedData.taskIds)
        )
      )
      .returning({ id: todoHqTasks.id });

    logger.info('Removed tasks from sprint', {
      sprintId,
      sprintName: sprint.name,
      taskCount: result.length,
    });

    return NextResponse.json({
      success: true,
      removedCount: result.length,
      taskIds: result.map((r) => r.id),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return createErrorResponse(error, 'Failed to remove tasks from sprint');
  }
}
