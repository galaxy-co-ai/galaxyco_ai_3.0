/**
 * Agent Messages API
 *
 * GET /api/orchestration/messages - Get messages for an agent
 * POST /api/orchestration/messages - Send a message between agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentMessages, agents, agentTeams } from '@/db/schema';
import { eq, and, desc, gte, or } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AgentMessageBus } from '@/lib/orchestration';
import { rateLimit } from '@/lib/rate-limit';

// Validation schema for sending a message
const sendMessageSchema = z.object({
  fromAgentId: z.string().uuid().optional(),
  toAgentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
  messageType: z.enum(['task', 'result', 'context', 'handoff', 'status', 'query']),
  content: z.object({
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(10000),
    data: z.record(z.unknown()).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    taskId: z.string().optional(),
    workflowExecutionId: z.string().optional(),
  }),
  parentMessageId: z.string().uuid().optional(),
});

/**
 * GET /api/orchestration/messages
 * Get messages for an agent or team
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const teamId = searchParams.get('teamId');
    const messageType = searchParams.get('messageType');
    const status = searchParams.get('status');
    const threadId = searchParams.get('threadId');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions
    const conditions = [eq(agentMessages.workspaceId, workspaceId)];

    if (agentId) {
      // Get messages where agent is sender OR receiver
      conditions.push(
        or(
          eq(agentMessages.fromAgentId, agentId),
          eq(agentMessages.toAgentId, agentId)
        )!
      );
    }

    if (teamId) {
      conditions.push(eq(agentMessages.teamId, teamId));
    }

    if (messageType) {
      conditions.push(eq(agentMessages.messageType, messageType as typeof agentMessages.messageType.enumValues[number]));
    }

    if (status) {
      conditions.push(eq(agentMessages.status, status));
    }

    if (threadId) {
      conditions.push(eq(agentMessages.threadId, threadId));
    }

    if (since) {
      conditions.push(gte(agentMessages.createdAt, new Date(since)));
    }

    // Fetch messages
    const messages = await db.query.agentMessages.findMany({
      where: and(...conditions),
      orderBy: [desc(agentMessages.createdAt)],
      limit,
      offset,
    });

    // Add agent/team names
    const messagesWithDetails = await Promise.all(
      messages.map(async (msg) => {
        let fromAgentName: string | null = null;
        let toAgentName: string | null = null;
        let teamName: string | null = null;

        if (msg.fromAgentId) {
          const fromAgent = await db.query.agents.findFirst({
            where: eq(agents.id, msg.fromAgentId),
          });
          fromAgentName = fromAgent?.name || null;
        }

        if (msg.toAgentId) {
          const toAgent = await db.query.agents.findFirst({
            where: eq(agents.id, msg.toAgentId),
          });
          toAgentName = toAgent?.name || null;
        }

        if (msg.teamId) {
          const team = await db.query.agentTeams.findFirst({
            where: eq(agentTeams.id, msg.teamId),
          });
          teamName = team?.name || null;
        }

        return {
          ...msg,
          fromAgentName,
          toAgentName,
          teamName,
        };
      })
    );

    return NextResponse.json({
      messages: messagesWithDetails,
      total: messagesWithDetails.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('[Messages API] Failed to list messages', error);
    return NextResponse.json(
      { error: 'Failed to list messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/messages
 * Send a message between agents
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
    const validation = sendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { fromAgentId, toAgentId, teamId, messageType, content, parentMessageId } = validation.data;

    // Must have either toAgentId or teamId
    if (!toAgentId && !teamId) {
      return NextResponse.json(
        { error: 'Either toAgentId or teamId is required' },
        { status: 400 }
      );
    }

    // Validate agents exist
    if (fromAgentId) {
      const fromAgent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, fromAgentId),
          eq(agents.workspaceId, workspaceId)
        ),
      });

      if (!fromAgent) {
        return NextResponse.json(
          { error: 'From agent not found' },
          { status: 400 }
        );
      }
    }

    if (toAgentId) {
      const toAgent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, toAgentId),
          eq(agents.workspaceId, workspaceId)
        ),
      });

      if (!toAgent) {
        return NextResponse.json(
          { error: 'To agent not found' },
          { status: 400 }
        );
      }
    }

    // Validate team exists
    if (teamId) {
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

    // Use message bus to send
    const messageBus = new AgentMessageBus(workspaceId);

    if (teamId && !toAgentId) {
      // Broadcast to team
      const messageIds = await messageBus.broadcast(teamId, {
        workspaceId,
        fromAgentId,
        teamId,
        messageType,
        content,
      });

      logger.info('[Messages API] Message broadcast to team', {
        teamId,
        messageCount: messageIds.length,
      });

      return NextResponse.json({
        success: true,
        messageIds,
        broadcast: true,
      }, { status: 201 });
    } else {
      // Send direct message
      const messageId = await messageBus.send({
        workspaceId,
        fromAgentId,
        toAgentId,
        teamId,
        messageType,
        content,
        parentMessageId,
      });

      logger.info('[Messages API] Message sent', {
        messageId,
        fromAgentId,
        toAgentId,
      });

      return NextResponse.json({
        success: true,
        messageId,
        broadcast: false,
      }, { status: 201 });
    }
  } catch (error) {
    logger.error('[Messages API] Failed to send message', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
