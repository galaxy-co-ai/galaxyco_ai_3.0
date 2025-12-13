import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoHqEpics, todoHqTasks, todoHqSprints } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { BOOTSTRAP_TEMPLATE } from './template';

/**
 * Sprint definitions with comprehensive tag-based assignment rules
 * 
 * Each sprint has:
 * - Unique name and goal
 * - Tags that match epics/tasks to this sprint
 * - Fallback epic names for items without matching tags
 */
interface SprintDefinition {
  name: string;
  description: string;
  goal: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  color: string;
  sortOrder: number;
  matchTags: string[];
  matchEpics: string[];
}

const SPRINT_DEFINITIONS: SprintDefinition[] = [
  {
    name: 'Phase 1: Quick Wins',
    description: 'Completed foundational UI/UX improvements',
    goal: 'Settings, Dashboard polish, Mobile UX, Notifications (COMPLETED)',
    status: 'completed' as const,
    color: 'green',
    sortOrder: 0,
    // Match tasks with phase-1 tag
    matchTags: ['phase-1'],
    matchEpics: [],
  },
  {
    name: 'Sprint 1: CRM Completion',
    description: 'Finalize CRM functionality',
    goal: 'Custom fields, import/export, email sync, calendar sync, activity timeline',
    status: 'in_progress' as const,
    color: 'blue',
    sortOrder: 1,
    matchTags: ['crm', 'contacts', 'sales', 'leads', 'deals', 'phase-2'],
    matchEpics: ['CRM Dashboard', 'Contacts Management', 'Deals Pipeline', 'Lead Qualification', 'Sales Analytics'],
  },
  {
    name: 'Sprint 2: Integrations Foundation',
    description: 'Real OAuth flows and external service connections',
    goal: 'Google Calendar, Outlook, Gmail sync, OAuth for all apps',
    status: 'planned' as const,
    color: 'purple',
    sortOrder: 2,
    matchTags: ['integrations', 'oauth', 'calendar', 'email', 'google', 'outlook', 'gmail', 'sync'],
    matchEpics: ['Connected Apps', 'Calendar Integration', 'Email Integration'],
  },
  {
    name: 'Sprint 3: Communications Suite',
    description: 'SignalWire SMS and voice capabilities',
    goal: 'SMS send/receive, voice calls, transcription, campaigns',
    status: 'planned' as const,
    color: 'orange',
    sortOrder: 3,
    matchTags: ['signalwire', 'sms', 'voice', 'communication', 'calls', 'transcription', 'recording'],
    matchEpics: ['Communication (SignalWire)'],
  },
  {
    name: 'Sprint 4: Team & Admin',
    description: 'Multi-user workspace and administration',
    goal: 'User roles, permissions, invitations, workspace settings, admin tools',
    status: 'planned' as const,
    color: 'teal',
    sortOrder: 4,
    matchTags: ['admin', 'users', 'workspaces', 'permissions', 'rbac', 'roles', 'team', 'invitations', 'alerts', 'feedback'],
    matchEpics: ['Admin Dashboard', 'User Management', 'Workspace Management', 'Alert Badges System', 'Feedback Management'],
  },
  {
    name: 'Sprint 5: Billing & Enterprise',
    description: 'Stripe subscriptions and enterprise security',
    goal: 'Billing, SSO, MFA, usage limits, multi-entity support',
    status: 'planned' as const,
    color: 'pink',
    sortOrder: 5,
    matchTags: ['billing', 'stripe', 'sso', 'enterprise', 'mfa', 'security', 'subscription', 'payments'],
    matchEpics: ['Authentication & User Management'],
  },
  {
    name: 'Sprint 6: Finance Suite',
    description: 'Financial management and integrations',
    goal: 'QuickBooks, Stripe, Shopify integrations, expense management, budgets',
    status: 'planned' as const,
    color: 'emerald',
    sortOrder: 6,
    matchTags: ['finance', 'quickbooks', 'shopify', 'expenses', 'invoices', 'budgets', 'accounting', 'transactions', 'reconciliation', 'tax'],
    matchEpics: ['Finance Dashboard', 'Finance Integrations', 'Finance HQ'],
  },
  {
    name: 'Sprint 7: Knowledge Platform',
    description: 'Document management and knowledge base',
    goal: 'Versioning, collaboration, permissions, RAG, knowledge graph',
    status: 'planned' as const,
    color: 'indigo',
    sortOrder: 7,
    matchTags: ['knowledge', 'documents', 'library', 'versioning', 'collaboration', 'rag', 'graph', 'articles', 'learning', 'templates'],
    matchEpics: ['Knowledge Base (Library)', 'Knowledge (New Version)', 'Creator Studio', 'Launchpad (Learning Hub)'],
  },
  {
    name: 'Sprint 8: Agent & Orchestration',
    description: 'AI agents, workflows, and automation',
    goal: 'Agent creation, marketplace, workflows, approvals, memory system',
    status: 'planned' as const,
    color: 'violet',
    sortOrder: 8,
    matchTags: ['orchestration', 'agents', 'workflows', 'memory', 'messaging', 'approvals', 'automation', 'ai', 'wizard', 'marketplace', 'sandbox'],
    matchEpics: ['Agent Teams', 'Workflows', 'Approvals & Autonomy', 'Agent Memory System', 'Message Bus', 'Neptune AI Integration', 'Agents Dashboard'],
  },
  {
    name: 'Sprint 9: Marketing & Content',
    description: 'Marketing automation and content management',
    goal: 'Email/SMS campaigns, social scheduler, A/B testing, attribution',
    status: 'planned' as const,
    color: 'rose',
    sortOrder: 9,
    matchTags: ['marketing', 'content', 'blog', 'campaigns', 'automation', 'social', 'scheduling', 'attribution'],
    matchEpics: ['Blog Posts Management', 'Marketing Dashboard', 'Marketing Automation', 'Analytics & Insights'],
  },
  {
    name: 'Sprint 10: Core Platform Polish',
    description: 'Dashboard, navigation, and platform fundamentals',
    goal: 'Real-time updates, WebSocket, activity feed, conversations, onboarding',
    status: 'planned' as const,
    color: 'slate',
    sortOrder: 10,
    matchTags: ['core', 'dashboard', 'navigation', 'onboarding', 'activity', 'conversations', 'realtime', 'websocket', 'threads', 'attachments'],
    matchEpics: ['Dashboard', 'Navigation & Search', 'Settings & Configuration', 'Onboarding', 'Activity Feed', 'Conversations Platform'],
  },
];

/**
 * Determine which sprint a task belongs to based on:
 * 1. Task tags (highest priority)
 * 2. Epic name (fallback)
 * 3. Epic tags (second fallback)
 */
function getSprintForTask(
  taskTags: string[],
  epicName: string,
  epicTags: string[],
  sprintIdMap: Record<string, string>
): string | null {
  // First check task tags for explicit assignment (phase-1, phase-2)
  for (const sprint of SPRINT_DEFINITIONS) {
    for (const matchTag of sprint.matchTags) {
      if (taskTags.includes(matchTag)) {
        return sprintIdMap[sprint.name] || null;
      }
    }
  }

  // Then check epic name for assignment
  for (const sprint of SPRINT_DEFINITIONS) {
    if (sprint.matchEpics.includes(epicName)) {
      return sprintIdMap[sprint.name] || null;
    }
  }

  // Finally check epic tags
  for (const sprint of SPRINT_DEFINITIONS) {
    for (const matchTag of sprint.matchTags) {
      if (epicTags.includes(matchTag)) {
        return sprintIdMap[sprint.name] || null;
      }
    }
  }

  // No match - goes to backlog (null)
  return null;
}

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
        { error: 'To-Do HQ already bootstrapped. Use Reset to start fresh.' },
        { status: 409 }
      );
    }

    let createdEpicsCount = 0;
    let createdTasksCount = 0;
    let createdSprintsCount = 0;
    let assignedTasksCount = 0;

    // Create all sprints first
    const sprintIdMap: Record<string, string> = {};
    for (const sprintDef of SPRINT_DEFINITIONS) {
      const [sprint] = await db
        .insert(todoHqSprints)
        .values({
          workspaceId: context.workspace.id,
          createdBy: user.id,
          name: sprintDef.name,
          description: sprintDef.description,
          goal: sprintDef.goal,
          status: sprintDef.status,
          color: sprintDef.color,
          sortOrder: sprintDef.sortOrder,
        })
        .returning();

      sprintIdMap[sprintDef.name] = sprint.id;
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

      // Create tasks for this epic with intelligent sprint assignment
      for (const taskTemplate of epicTemplate.tasks) {
        const taskTags = taskTemplate.tags || [];
        const epicTags = epicTemplate.tags || [];

        // Get the appropriate sprint for this task
        const sprintId = getSprintForTask(
          taskTags,
          epicTemplate.name,
          epicTags,
          sprintIdMap
        );

        if (sprintId) {
          assignedTasksCount++;
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

    logger.info(`Bootstrapped To-Do HQ with comprehensive sprint assignment`, {
      workspaceId: context.workspace.id,
      sprintsCreated: createdSprintsCount,
      epicsCreated: createdEpicsCount,
      tasksCreated: createdTasksCount,
      tasksAssignedToSprints: assignedTasksCount,
      tasksInBacklog: createdTasksCount - assignedTasksCount,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      sprintsCreated: createdSprintsCount,
      epicsCreated: createdEpicsCount,
      tasksCreated: createdTasksCount,
      tasksAssignedToSprints: assignedTasksCount,
      tasksInBacklog: createdTasksCount - assignedTasksCount,
      message: `To-Do HQ initialized with ${createdSprintsCount} sprints and ${createdTasksCount} tasks (${assignedTasksCount} assigned to sprints)`,
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to bootstrap To-Do HQ', { error });
    return NextResponse.json({ error: 'Failed to bootstrap To-Do HQ' }, { status: 500 });
  }
}
