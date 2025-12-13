/**
 * Workflow Detail API
 *
 * GET /api/orchestration/workflows/[id] - Get workflow details
 * PATCH /api/orchestration/workflows/[id] - Update workflow
 * DELETE /api/orchestration/workflows/[id] - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentWorkflows, agentWorkflowExecutions, agentWorkflowVersions, agentTeams, agents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Workflow step schema for updates
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

// Validation schema for updating a workflow
const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  teamId: z.string().uuid().nullable().optional(),
  triggerType: z.enum(['manual', 'event', 'schedule', 'agent_request']).optional(),
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
  steps: z.array(workflowStepSchema).optional(),
  status: z.enum(['active', 'paused', 'archived', 'draft']).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orchestration/workflows/[id]
 * Get workflow details with steps and recent executions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    // Get workflow
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get team info if associated
    let team = null;
    if (workflow.teamId) {
      const teamData = await db.query.agentTeams.findFirst({
        where: eq(agentTeams.id, workflow.teamId),
      });
      if (teamData) {
        team = {
          id: teamData.id,
          name: teamData.name,
          department: teamData.department,
        };
      }
    }

    // Get agent info for each step
    const steps = workflow.steps as Array<{ id: string; agentId: string; name: string; action: string; [key: string]: unknown }>;
    const stepsWithAgents = await Promise.all(
      steps.map(async (step) => {
        const agent = await db.query.agents.findFirst({
          where: eq(agents.id, step.agentId),
        });

        return {
          ...step,
          agent: agent ? {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
          } : null,
        };
      })
    );

    // Get recent executions
    const recentExecutions = await db.query.agentWorkflowExecutions.findMany({
      where: eq(agentWorkflowExecutions.workflowId, workflowId),
      orderBy: [desc(agentWorkflowExecutions.startedAt)],
      limit: 10,
    });

    return NextResponse.json({
      workflow: {
        ...workflow,
        steps: stepsWithAgents,
        team,
        recentExecutions: recentExecutions.map((exec) => ({
          id: exec.id,
          status: exec.status,
          currentStepIndex: exec.currentStepIndex,
          completedSteps: exec.completedSteps,
          totalSteps: exec.totalSteps,
          durationMs: exec.durationMs,
          startedAt: exec.startedAt,
          completedAt: exec.completedAt,
          error: exec.error,
        })),
      },
    });
  } catch (error) {
    logger.error('[Workflows API] Failed to get workflow', error);
    return NextResponse.json(
      { error: 'Failed to get workflow' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orchestration/workflows/[id]
 * Update workflow
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    // Get existing workflow
    const existingWorkflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = updateWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, category, teamId, triggerType, triggerConfig, steps, status } = validation.data;

    // Validate team if changing
    if (teamId !== undefined && teamId !== null) {
      const team = await db.query.agentTeams.findFirst({
        where: and(
          eq(agentTeams.id, teamId),
          eq(agentTeams.workspaceId, workspaceId)
        ),
      });

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (teamId !== undefined) updateData.teamId = teamId;
    if (triggerType !== undefined) updateData.triggerType = triggerType;
    if (triggerConfig !== undefined) updateData.triggerConfig = triggerConfig;
    if (steps !== undefined) updateData.steps = steps;
    if (status !== undefined) updateData.status = status;

    // Check if this is a meaningful change that should be versioned
    const shouldSaveVersion = steps !== undefined || triggerType !== undefined || triggerConfig !== undefined;

    if (shouldSaveVersion) {
      // Get the latest version number
      const latestVersion = await db.query.agentWorkflowVersions.findFirst({
        where: and(
          eq(agentWorkflowVersions.workflowId, workflowId),
          eq(agentWorkflowVersions.workspaceId, workspaceId)
        ),
        orderBy: [desc(agentWorkflowVersions.version)],
      });

      const user = await getCurrentUser();
      const newVersionNumber = (latestVersion?.version || 0) + 1;

      // Save current state as a version snapshot before updating
      await db.insert(agentWorkflowVersions).values({
        workspaceId,
        workflowId,
        version: newVersionNumber,
        name: existingWorkflow.name,
        description: existingWorkflow.description,
        triggerType: existingWorkflow.triggerType,
        triggerConfig: existingWorkflow.triggerConfig as Record<string, unknown>,
        steps: existingWorkflow.steps as Array<Record<string, unknown>>,
        changeDescription: name ? `Updated to "${name}"` : 'Workflow updated',
        changedBy: user.id,
      });
    }

    // Update workflow
    const [updatedWorkflow] = await db
      .update(agentWorkflows)
      .set(updateData)
      .where(eq(agentWorkflows.id, workflowId))
      .returning();

    logger.info('[Workflows API] Workflow updated', {
      workflowId: updatedWorkflow.id,
      name: updatedWorkflow.name,
      versionSaved: shouldSaveVersion,
    });

    return NextResponse.json({ workflow: updatedWorkflow });
  } catch (error) {
    logger.error('[Workflows API] Failed to update workflow', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orchestration/workflows/[id]
 * Delete a workflow
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    // Verify workflow exists
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Delete workflow (cascade will delete executions)
    await db.delete(agentWorkflows).where(eq(agentWorkflows.id, workflowId));

    logger.info('[Workflows API] Workflow deleted', {
      workflowId,
      name: workflow.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Workflows API] Failed to delete workflow', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
