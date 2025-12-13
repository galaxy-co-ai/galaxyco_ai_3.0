import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoHqEpics, todoHqTasks, todoHqSprints } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// DELETE - Clear all To-Do HQ data for workspace
export async function DELETE(request: NextRequest) {
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

    // Delete all tasks first (due to foreign key constraints)
    const deletedTasks = await db
      .delete(todoHqTasks)
      .where(eq(todoHqTasks.workspaceId, context.workspace.id))
      .returning();

    // Delete all epics
    const deletedEpics = await db
      .delete(todoHqEpics)
      .where(eq(todoHqEpics.workspaceId, context.workspace.id))
      .returning();

    // Delete all sprints
    const deletedSprints = await db
      .delete(todoHqSprints)
      .where(eq(todoHqSprints.workspaceId, context.workspace.id))
      .returning();

    logger.info(`Cleared To-Do HQ data`, {
      workspaceId: context.workspace.id,
      sprintsDeleted: deletedSprints.length,
      epicsDeleted: deletedEpics.length,
      tasksDeleted: deletedTasks.length,
    });

    return NextResponse.json({
      success: true,
      sprintsDeleted: deletedSprints.length,
      epicsDeleted: deletedEpics.length,
      tasksDeleted: deletedTasks.length,
      message: 'To-Do HQ data cleared successfully',
    });
  } catch (error) {
    logger.error('Failed to clear To-Do HQ data', error);
    return NextResponse.json({ error: 'Failed to clear To-Do HQ data' }, { status: 500 });
  }
}
