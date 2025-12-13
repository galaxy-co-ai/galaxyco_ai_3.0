/**
 * Workflow Versions API
 *
 * GET /api/orchestration/workflows/[id]/versions - List version history
 * POST /api/orchestration/workflows/[id]/versions - Restore a specific version
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentWorkflows, agentWorkflowVersions, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orchestration/workflows/[id]/versions
 * List all versions for a workflow
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    // Verify workflow exists and belongs to workspace
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get all versions with user info
    const versions = await db
      .select({
        id: agentWorkflowVersions.id,
        version: agentWorkflowVersions.version,
        name: agentWorkflowVersions.name,
        description: agentWorkflowVersions.description,
        triggerType: agentWorkflowVersions.triggerType,
        triggerConfig: agentWorkflowVersions.triggerConfig,
        steps: agentWorkflowVersions.steps,
        changeDescription: agentWorkflowVersions.changeDescription,
        changedAt: agentWorkflowVersions.changedAt,
        changedBy: agentWorkflowVersions.changedBy,
        changedByName: users.firstName,
        changedByLastName: users.lastName,
        changedByEmail: users.email,
      })
      .from(agentWorkflowVersions)
      .leftJoin(users, eq(agentWorkflowVersions.changedBy, users.id))
      .where(
        and(
          eq(agentWorkflowVersions.workflowId, workflowId),
          eq(agentWorkflowVersions.workspaceId, workspaceId)
        )
      )
      .orderBy(desc(agentWorkflowVersions.version));

    // Transform to include full user name
    const versionsWithUser = versions.map((v) => ({
      id: v.id,
      version: v.version,
      name: v.name,
      description: v.description,
      triggerType: v.triggerType,
      triggerConfig: v.triggerConfig,
      steps: v.steps,
      changeDescription: v.changeDescription,
      changedAt: v.changedAt,
      changedBy: {
        id: v.changedBy,
        name: [v.changedByName, v.changedByLastName].filter(Boolean).join(' ') || v.changedByEmail || 'Unknown',
        email: v.changedByEmail,
      },
    }));

    return NextResponse.json({
      versions: versionsWithUser,
      currentVersion: workflow.steps ? versions.length + 1 : 1,
    });
  } catch (error) {
    logger.error('[Workflow Versions API] Failed to get versions', error);
    return NextResponse.json(
      { error: 'Failed to get workflow versions' },
      { status: 500 }
    );
  }
}

// Schema for restoring a version
const restoreVersionSchema = z.object({
  versionId: z.string().uuid(),
});

/**
 * POST /api/orchestration/workflows/[id]/versions
 * Restore a workflow to a specific version
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: workflowId } = await params;

    // Parse body
    const body = await request.json();
    const validation = restoreVersionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { versionId } = validation.data;

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

    // Get the version to restore
    const versionToRestore = await db.query.agentWorkflowVersions.findFirst({
      where: and(
        eq(agentWorkflowVersions.id, versionId),
        eq(agentWorkflowVersions.workflowId, workflowId),
        eq(agentWorkflowVersions.workspaceId, workspaceId)
      ),
    });

    if (!versionToRestore) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // Get the latest version number
    const latestVersion = await db.query.agentWorkflowVersions.findFirst({
      where: and(
        eq(agentWorkflowVersions.workflowId, workflowId),
        eq(agentWorkflowVersions.workspaceId, workspaceId)
      ),
      orderBy: [desc(agentWorkflowVersions.version)],
    });

    const newVersionNumber = (latestVersion?.version || 0) + 1;

    // Save current state as a new version before restoring
    await db.insert(agentWorkflowVersions).values({
      workspaceId,
      workflowId,
      version: newVersionNumber,
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig as Record<string, unknown>,
      steps: workflow.steps as Array<Record<string, unknown>>,
      changeDescription: `Restored from version ${versionToRestore.version}`,
      changedBy: user.id,
    });

    // Restore the workflow to the selected version
    const [updatedWorkflow] = await db
      .update(agentWorkflows)
      .set({
        name: versionToRestore.name,
        description: versionToRestore.description,
        triggerType: versionToRestore.triggerType as 'manual' | 'event' | 'schedule' | 'agent_request',
        triggerConfig: versionToRestore.triggerConfig,
        steps: versionToRestore.steps as Array<{
          id: string;
          name: string;
          agentId: string;
          action: string;
          inputs: Record<string, unknown>;
          conditions?: Array<{ field: string; operator: string; value: unknown }>;
          onSuccess?: string;
          onFailure?: string;
          timeout?: number;
          retryConfig?: { maxAttempts: number; backoffMs: number };
        }>,
        updatedAt: new Date(),
      })
      .where(eq(agentWorkflows.id, workflowId))
      .returning();

    logger.info('[Workflow Versions API] Workflow restored', {
      workflowId,
      restoredFromVersion: versionToRestore.version,
      newVersion: newVersionNumber,
    });

    return NextResponse.json({
      workflow: updatedWorkflow,
      restoredFromVersion: versionToRestore.version,
      newVersion: newVersionNumber,
    });
  } catch (error) {
    logger.error('[Workflow Versions API] Failed to restore version', error);
    return NextResponse.json(
      { error: 'Failed to restore workflow version' },
      { status: 500 }
    );
  }
}
