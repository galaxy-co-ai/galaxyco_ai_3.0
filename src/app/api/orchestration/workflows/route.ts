/**
 * Agent Workflows API
 *
 * GET /api/orchestration/workflows - List all workflows
 * POST /api/orchestration/workflows - Create a new workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { agentWorkflows, agentTeams, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Workflow step schema
const workflowStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  agentId: z.string().uuid(),
  action: z.string(),
  inputs: z.record(z.unknown()).default({}),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'exists']),
    value: z.unknown(),
  })).optional(),
  onSuccess: z.string().optional(),
  onFailure: z.string().optional(),
  timeout: z.number().int().min(0).optional(),
  retryConfig: z.object({
    maxAttempts: z.number().int().min(1).max(10),
    backoffMs: z.number().int().min(100),
  }).optional(),
});

// Validation schema for creating a workflow
const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100),
  description: z.string().optional(),
  category: z.string().optional(),
  teamId: z.string().uuid().optional(),
  triggerType: z.enum(['manual', 'event', 'schedule', 'agent_request']),
  triggerConfig: z.object({
    eventType: z.string().optional(),
    cron: z.string().optional(),
    webhookSecret: z.string().optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.unknown(),
    })).optional(),
  }).optional(),
  steps: z.array(workflowStepSchema).min(1, 'At least one step is required'),
  status: z.enum(['active', 'paused', 'archived', 'draft']).default('draft'),
});

/**
 * GET /api/orchestration/workflows
 * List all workflows for the workspace
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and workspace
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user?.activeWorkspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 });
    }

    const workspaceId = user.activeWorkspaceId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const triggerType = searchParams.get('triggerType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions
    const conditions = [eq(agentWorkflows.workspaceId, workspaceId)];

    if (teamId) {
      conditions.push(eq(agentWorkflows.teamId, teamId));
    }

    if (status) {
      conditions.push(eq(agentWorkflows.status, status as typeof agentWorkflows.status.enumValues[number]));
    }

    if (category) {
      conditions.push(eq(agentWorkflows.category, category));
    }

    if (triggerType) {
      conditions.push(eq(agentWorkflows.triggerType, triggerType as typeof agentWorkflows.triggerType.enumValues[number]));
    }

    // Fetch workflows
    const workflows = await db.query.agentWorkflows.findMany({
      where: and(...conditions),
      orderBy: [desc(agentWorkflows.createdAt)],
      limit,
      offset,
    });

    // Add team names
    const workflowsWithTeams = await Promise.all(
      workflows.map(async (workflow) => {
        let teamName: string | null = null;
        if (workflow.teamId) {
          const team = await db.query.agentTeams.findFirst({
            where: eq(agentTeams.id, workflow.teamId),
          });
          teamName = team?.name || null;
        }

        return {
          ...workflow,
          teamName,
          stepCount: (workflow.steps as unknown[])?.length || 0,
        };
      })
    );

    return NextResponse.json({
      workflows: workflowsWithTeams,
      total: workflowsWithTeams.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('[Workflows API] Failed to list workflows', error);
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and workspace
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user?.activeWorkspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 });
    }

    const workspaceId = user.activeWorkspaceId;

    // Parse and validate body
    const body = await request.json();
    const validation = createWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, category, teamId, triggerType, triggerConfig, steps, status } = validation.data;

    // Validate team if provided
    if (teamId) {
      const team = await db.query.agentTeams.findFirst({
        where: and(
          eq(agentTeams.id, teamId),
          eq(agentTeams.workspaceId, workspaceId)
        ),
      });

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found or does not belong to workspace' },
          { status: 400 }
        );
      }
    }

    // Create the workflow
    const [workflow] = await db
      .insert(agentWorkflows)
      .values({
        workspaceId,
        teamId,
        name,
        description,
        category,
        triggerType,
        triggerConfig: triggerConfig || {},
        steps,
        status,
        createdBy: user.id,
      })
      .returning();

    logger.info('[Workflows API] Workflow created', {
      workflowId: workflow.id,
      name: workflow.name,
      triggerType: workflow.triggerType,
      stepCount: steps.length,
    });

    return NextResponse.json({
      workflow: {
        ...workflow,
        stepCount: steps.length,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('[Workflows API] Failed to create workflow', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

