import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Temporary storage (same as route.ts)
const workflows = new Map<string, any>();
const executions = new Map<string, any>();

const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    const workflow = workflows.get(workflowId);

    if (!workflow || workflow.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    return createErrorResponse(error, 'Get workflow error');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateWorkflowSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const workflow = workflows.get(workflowId);

    if (!workflow || workflow.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    // Update workflow
    const updated = {
      ...workflow,
      ...data,
      updatedAt: new Date().toISOString(),
      version: workflow.version + 1,
    };

    workflows.set(workflowId, updated);

    return NextResponse.json(updated);
  } catch (error) {
    return createErrorResponse(error, 'Update workflow error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    const workflow = workflows.get(workflowId);

    if (!workflow || workflow.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    workflows.delete(workflowId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete workflow error');
  }
}


