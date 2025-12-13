import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { broadcastActivity } from '@/lib/pusher-server';
import { logger } from '@/lib/logger';

// Valid agent types from schema
const agentTypeValues = [
  'scope',
  'call',
  'email',
  'note',
  'task',
  'roadmap',
  'content',
  'custom',
  'browser',
  'cross-app',
] as const;

// Validation schema for creating agents
const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(agentTypeValues).default('custom'),
  status: z.enum(['draft', 'active', 'paused', 'archived']).default('draft'),
  config: z
    .object({
      tone: z.enum(['professional', 'friendly', 'concise']).optional(),
      capabilities: z.array(z.string()).optional(),
      trigger: z
        .object({
          type: z.enum(['manual', 'schedule', 'event']),
          config: z.record(z.unknown()).optional(),
        })
        .optional(),
      systemPrompt: z.string().optional(),
      templateId: z.string().optional(),
      aiProvider: z.enum(['openai', 'anthropic', 'google', 'custom']).optional(),
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(100000).optional(),
      tools: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const agentsList = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.createdAt)],
      limit: 50,
    });

    // Return wrapped in an object with 'agents' key for consistent API response
    return NextResponse.json({
      agents: agentsList.map((agent: (typeof agentsList)[0]) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        status: agent.status,
        executionCount: agent.executionCount,
        lastExecutedAt: agent.lastExecutedAt,
        createdAt: agent.createdAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get agents error');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const body = await request.json();

    // Validate input
    const validationResult = createAgentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get user ID (handle dev bypass case where user might be null)
    const creatorId = user?.id;
    if (!creatorId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Create the agent
    const [newAgent] = await db
      .insert(agents)
      .values({
        workspaceId,
        name: data.name,
        description: data.description || null,
        type: data.type,
        status: data.status,
        config: data.config || {},
        createdBy: creatorId,
      })
      .returning();

    // Broadcast real-time activity event (non-blocking)
    broadcastActivity(workspaceId, {
      id: newAgent.id,
      type: 'agent:created',
      title: 'New agent created',
      description: `${newAgent.name} was created`,
      entityType: 'agent',
      entityId: newAgent.id,
      userId: creatorId,
    }).catch(err => {
      logger.error('Activity broadcast failed (non-critical)', err);
    });

    return NextResponse.json({
      id: newAgent.id,
      name: newAgent.name,
      description: newAgent.description,
      type: newAgent.type,
      status: newAgent.status,
      config: newAgent.config,
      createdAt: newAgent.createdAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Create agent error');
  }
}









