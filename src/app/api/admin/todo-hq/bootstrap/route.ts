import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoHqEpics, todoHqTasks, todoHqSprints } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { BOOTSTRAP_TEMPLATE } from './template';

// Predefined sprints to create during bootstrap
const INITIAL_SPRINTS = [
  {
    name: 'Phase 1: Quick Wins',
    description: 'Settings, Dashboard, Mobile, and UI polish tasks',
    goal: 'Complete foundational UI/UX improvements (COMPLETED)',
    status: 'completed' as const,
    color: 'green',
    sortOrder: 1,
  },
  {
    name: 'Sprint 1: CRM Polish',
    description: 'Finalize CRM functionality and integrations',
    goal: 'Complete remaining CRM gaps like import/export and activity timeline',
    status: 'planned' as const,
    color: 'blue',
    sortOrder: 2,
  },
  {
    name: 'Sprint 2: Integrations Foundation',
    description: 'Real OAuth for Google, Outlook, and core integrations',
    goal: 'Enable real calendar and email sync with external services',
    status: 'planned' as const,
    color: 'purple',
    sortOrder: 3,
  },
  {
    name: 'Sprint 3: Communications Suite',
    description: 'SignalWire SMS and voice capabilities',
    goal: 'Enable SMS sending/receiving and voice calls',
    status: 'planned' as const,
    color: 'orange',
    sortOrder: 4,
  },
  {
    name: 'Sprint 4: Team & Permissions',
    description: 'Multi-user workspace and role-based access',
    goal: 'Enable team invitations, permissions, and workspace management',
    status: 'planned' as const,
    color: 'teal',
    sortOrder: 5,
  },
  {
    name: 'Sprint 5: Billing & Enterprise',
    description: 'Stripe subscriptions and enterprise features',
    goal: 'Enable billing, SSO, and usage limits',
    status: 'planned' as const,
    color: 'pink',
    sortOrder: 6,
  },
];

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
    let createdSprintsCount = 0;

    // Create initial sprints
    const sprintIdMap: Record<string, string> = {};
    for (const sprintTemplate of INITIAL_SPRINTS) {
      const [sprint] = await db
        .insert(todoHqSprints)
        .values({
          workspaceId: context.workspace.id,
          createdBy: user.id,
          name: sprintTemplate.name,
          description: sprintTemplate.description,
          goal: sprintTemplate.goal,
          status: sprintTemplate.status,
          color: sprintTemplate.color,
          sortOrder: sprintTemplate.sortOrder,
        })
        .returning();

      sprintIdMap[sprintTemplate.name] = sprint.id;
      createdSprintsCount++;
    }

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
        // Determine sprint assignment based on tags
        let sprintId: string | null = null;
        const tags = taskTemplate.tags || [];

        if (tags.includes('phase-1')) {
          sprintId = sprintIdMap['Phase 1: Quick Wins'] || null;
        } else if (tags.includes('phase-2')) {
          sprintId = sprintIdMap['Sprint 1: CRM Polish'] || null;
        }

        await db.insert(todoHqTasks).values({
          workspaceId: context.workspace.id,
          createdBy: user.id,
          epicId: epic.id,
          sprintId,
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
      sprintsCreated: createdSprintsCount,
      epicsCreated: createdEpicsCount,
      tasksCreated: createdTasksCount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      sprintsCreated: createdSprintsCount,
      epicsCreated: createdEpicsCount,
      tasksCreated: createdTasksCount,
      message: 'To-Do HQ successfully bootstrapped with sprints and tasks',
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to bootstrap To-Do HQ', error);
    return NextResponse.json({ error: 'Failed to bootstrap To-Do HQ' }, { status: 500 });
  }
}
