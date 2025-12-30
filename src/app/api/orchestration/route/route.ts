/**
 * Task Routing API
 *
 * POST /api/orchestration/route - Route a task to the most appropriate agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AgentOrchestrator } from '@/lib/orchestration';
import { rateLimit } from '@/lib/rate-limit';

// Validation schema
const routeTaskSchema = z.object({
  taskType: z.string().min(1),
  description: z.string().min(1).max(2000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  data: z.record(z.unknown()).optional(),
  preferredAgentId: z.string().uuid().optional(),
  preferredTeamId: z.string().uuid().optional(),
  requiredCapabilities: z.array(z.string()).optional(),
  deadline: z.string().datetime().optional(),
});

/**
 * POST /api/orchestration/route
 * Route a task to the most appropriate agent
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`orchestration:${userId}`, 100, 3600);
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

    // Parse and validate body
    const body = await request.json();
    const validation = routeTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      taskType,
      description,
      priority,
      data,
      preferredAgentId,
      preferredTeamId,
      requiredCapabilities,
      deadline,
    } = validation.data;

    logger.info('[Route API] Routing task', {
      taskType,
      priority,
      preferredAgentId,
      preferredTeamId,
    });

    // Create orchestrator and route task
    const orchestrator = new AgentOrchestrator(workspaceId);
    const assignment = await orchestrator.routeTask({
      workspaceId,
      taskType,
      description,
      priority,
      data,
      preferredAgentId,
      preferredTeamId,
      requiredCapabilities,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    if (!assignment.agentId) {
      return NextResponse.json({
        success: false,
        message: 'No suitable agent found for this task',
        suggestion: 'Try creating an agent with the required capabilities or specify a different task type',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignment: {
        agentId: assignment.agentId,
        agentName: assignment.agentName,
        teamId: assignment.teamId,
        teamName: assignment.teamName,
        confidence: assignment.confidence,
        reason: assignment.reason,
      },
      task: {
        taskType,
        description,
        priority,
      },
    });
  } catch (error) {
    logger.error('[Route API] Failed to route task', error);
    return NextResponse.json(
      { error: 'Failed to route task' },
      { status: 500 }
    );
  }
}
