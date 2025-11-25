import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Note: This requires adding workflow tables to your schema
// For now, we'll store workflows in a JSON structure

const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  trigger: z.any().optional(),
});

// Temporary in-memory storage (replace with database)
const workflows = new Map<string, any>();

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // In production, query from database
    const workspaceWorkflows = Array.from(workflows.values())
      .filter((w) => w.workspaceId === workspaceId);

    return NextResponse.json({
      workflows: workspaceWorkflows.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        status: w.status,
        nodeCount: w.nodes?.length || 0,
        createdAt: w.createdAt,
        lastExecutedAt: w.lastExecutedAt,
      })),
    });
  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const body = await request.json();

    const validationResult = workflowSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflow = {
      id: workflowId,
      workspaceId,
      createdBy: user.id,
      name: data.name,
      description: data.description,
      nodes: data.nodes,
      edges: data.edges,
      trigger: data.trigger,
      status: 'draft',
      version: 1,
      executionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In production, save to database
    workflows.set(workflowId, workflow);

    return NextResponse.json({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      createdAt: workflow.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}






