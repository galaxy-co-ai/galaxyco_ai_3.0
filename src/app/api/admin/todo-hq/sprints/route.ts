/**
 * To-Do HQ Sprints API
 * GET /api/admin/todo-hq/sprints - Get all sprints with task counts
 * POST /api/admin/todo-hq/sprints - Create a new sprint
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { todoHqSprints, todoHqTasks } from '@/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const createSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required'),
  description: z.string().optional(),
  goal: z.string().optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortOrder: z.number().optional(),
  color: z.string().optional(),
});

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all sprints with task counts
    const sprints = await db
      .select({
        id: todoHqSprints.id,
        name: todoHqSprints.name,
        description: todoHqSprints.description,
        goal: todoHqSprints.goal,
        status: todoHqSprints.status,
        startDate: todoHqSprints.startDate,
        endDate: todoHqSprints.endDate,
        sortOrder: todoHqSprints.sortOrder,
        color: todoHqSprints.color,
        createdAt: todoHqSprints.createdAt,
        updatedAt: todoHqSprints.updatedAt,
      })
      .from(todoHqSprints)
      .where(eq(todoHqSprints.workspaceId, workspaceId))
      .orderBy(todoHqSprints.sortOrder);

    // Get task counts for each sprint
    const sprintsWithCounts = await Promise.all(
      sprints.map(async (sprint) => {
        const taskCounts = await db
          .select({
            total: count(),
            done: sql<number>`COUNT(*) FILTER (WHERE ${todoHqTasks.status} = 'done')`,
          })
          .from(todoHqTasks)
          .where(
            and(
              eq(todoHqTasks.workspaceId, workspaceId),
              eq(todoHqTasks.sprintId, sprint.id)
            )
          );

        const total = Number(taskCounts[0]?.total || 0);
        const done = Number(taskCounts[0]?.done || 0);

        return {
          ...sprint,
          taskCount: total,
          completedTaskCount: done,
          completionPercent: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      })
    );

    // Also get backlog count (tasks without a sprint)
    const backlogCounts = await db
      .select({
        total: count(),
        done: sql<number>`COUNT(*) FILTER (WHERE ${todoHqTasks.status} = 'done')`,
      })
      .from(todoHqTasks)
      .where(
        and(
          eq(todoHqTasks.workspaceId, workspaceId),
          sql`${todoHqTasks.sprintId} IS NULL`
        )
      );

    const backlogTotal = Number(backlogCounts[0]?.total || 0);
    const backlogDone = Number(backlogCounts[0]?.done || 0);

    return NextResponse.json({
      sprints: sprintsWithCounts,
      backlog: {
        taskCount: backlogTotal,
        completedTaskCount: backlogDone,
        completionPercent: backlogTotal > 0 ? Math.round((backlogDone / backlogTotal) * 100) : 0,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch sprints');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();

    const validatedData = createSprintSchema.parse(body);

    // Get the next sort order
    const maxSortOrder = await db
      .select({ max: sql<number>`COALESCE(MAX(${todoHqSprints.sortOrder}), 0)` })
      .from(todoHqSprints)
      .where(eq(todoHqSprints.workspaceId, workspaceId));

    const nextSortOrder = (maxSortOrder[0]?.max || 0) + 1;

    const [newSprint] = await db
      .insert(todoHqSprints)
      .values({
        workspaceId,
        name: validatedData.name,
        description: validatedData.description || null,
        goal: validatedData.goal || null,
        status: validatedData.status || 'planned',
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        sortOrder: validatedData.sortOrder ?? nextSortOrder,
        color: validatedData.color || 'blue',
        createdBy: userId,
      })
      .returning();

    logger.info('Created sprint', { sprintId: newSprint.id, name: newSprint.name });

    return NextResponse.json({ sprint: newSprint }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return createErrorResponse(error, 'Failed to create sprint');
  }
}
