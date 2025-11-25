import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';

// Temporary storage (same as route.ts)
const workflows = new Map<string, any>();
const executions = new Map<string, any>();

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
    console.error('Get workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
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

    const workflow = workflows.get(workflowId);

    if (!workflow || workflow.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Update workflow
    const updated = {
      ...workflow,
      ...body,
      updatedAt: new Date().toISOString(),
      version: workflow.version + 1,
    };

    workflows.set(workflowId, updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
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
    console.error('Delete workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}


