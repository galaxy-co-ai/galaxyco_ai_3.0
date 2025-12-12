import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoHqEpics, todoHqTasks } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { BOOTSTRAP_TEMPLATE } from './template';

// POST - Bootstrap To-Do HQ with initial data
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

    // Check if data already exists
    const existingEpics = await db.query.todoHqEpics.findFirst({
      where: eq(todoHqEpics.workspaceId, context.workspace.id),
    });

    if (existingEpics) {
      return NextResponse.json(
        { error: 'To-Do HQ already bootstrapped. Data already exists.' },
        { status: 409 }
      );
    }

    let createdEpicsCount = 0;
    let createdTasksCount = 0;

    // Create epics and tasks from template
    for (const epicTemplate of BOOTSTRAP_TEMPLATE.epics) {
      // Create epic
      const [epic] = await db
        .insert(todoHqEpics)
        .values({
          workspaceId: context.workspace.id,
          createdBy: user.id,
          name: epicTemplate.name,
          description: epicTemplate.description || null,
          status: epicTemplate.status,
          targetCompletionPercent: epicTemplate.targetCompletionPercent || 100,
          sortOrder: epicTemplate.sortOrder,
          tags: epicTemplate.tags || [],
        })
        .returning();

      createdEpicsCount++;

      // Create tasks for this epic
      for (const taskTemplate of epicTemplate.tasks) {
        await db.insert(todoHqTasks).values({
          workspaceId: context.workspace.id,
          createdBy: user.id,
          epicId: epic.id,
          title: taskTemplate.title,
          description: taskTemplate.description || null,
          status: taskTemplate.status,
          priority: taskTemplate.priority,
          sortOrder: taskTemplate.sortOrder,
          tags: taskTemplate.tags || [],
          notes: taskTemplate.notes || null,
        });

        createdTasksCount++;
      }
    }

    logger.info(`Bootstrapped To-Do HQ`, {
      workspaceId: context.workspace.id,
      epicsCreated: createdEpicsCount,
      tasksCreated: createdTasksCount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      epicsCreated: createdEpicsCount,
      tasksCreated: createdTasksCount,
      message: 'To-Do HQ successfully bootstrapped with initial data',
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to bootstrap To-Do HQ', error);
    return NextResponse.json({ error: 'Failed to bootstrap To-Do HQ' }, { status: 500 });
  }
}
