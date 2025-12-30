import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// Must match agentTypeEnum in schema.ts
const workflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  type: z.enum([
    'scope', 'call', 'email', 'note', 'task', 'roadmap', 'content', 'custom',
    'browser', 'cross-app', 'knowledge', 'sales', 'trending', 'research',
    'meeting', 'code', 'data', 'security'
  ]).default('custom'),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  trigger: z.any().optional(),
  systemPrompt: z.string().optional(),
});

export async function GET() {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`workflows:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    // Query agents from database (agents are the underlying model for workflows)
    const workspaceAgents = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.createdAt)],
    });

    return NextResponse.json({
      workflows: workspaceAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        nodeCount: (agent.config as any)?.nodes?.length || 0,
        executionCount: agent.executionCount,
        createdAt: agent.createdAt,
        lastExecutedAt: agent.lastExecutedAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get workflows error');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`workflows:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const body = await request.json();

    const validationResult = workflowSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create agent in database
    const [newAgent] = await db
      .insert(agents)
      .values({
        workspaceId,
        createdBy: user.id,
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        status: 'draft',
        config: {
          systemPrompt: data.systemPrompt || undefined,
          triggers: data.trigger ? [{ type: 'manual', config: data.trigger }] : undefined,
        },
      })
      .returning();

    logger.info('Workflow/Agent created', { id: newAgent.id, name: newAgent.name, workspaceId });

    return NextResponse.json({
      id: newAgent.id,
      name: newAgent.name,
      description: newAgent.description,
      type: newAgent.type,
      status: newAgent.status,
      createdAt: newAgent.createdAt,
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create workflow error');
  }
}








