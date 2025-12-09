/**
 * Agent Shared Memory API
 *
 * GET /api/orchestration/memory - Query shared memories
 * POST /api/orchestration/memory - Store a new memory
 * DELETE /api/orchestration/memory - Delete a memory
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentSharedMemory, agents, agentTeams } from '@/db/schema';
import { eq, and, desc, gte, or, isNull, like } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AgentMemoryService } from '@/lib/orchestration';

// Validation schema for storing memory
const storeMemorySchema = z.object({
  teamId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  memoryTier: z.enum(['short_term', 'medium_term', 'long_term']),
  category: z.enum(['context', 'pattern', 'preference', 'knowledge', 'relationship']),
  key: z.string().min(1).max(200),
  value: z.unknown(),
  metadata: z.object({
    source: z.string().optional(),
    confidence: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
    relatedMemoryIds: z.array(z.string()).optional(),
  }).optional(),
  importance: z.number().min(0).max(100).default(50),
  expiresAt: z.string().datetime().optional(),
});

// Validation schema for deleting memory
const deleteMemorySchema = z.object({
  memoryId: z.string().uuid(),
});

/**
 * GET /api/orchestration/memory
 * Query shared memories
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const agentId = searchParams.get('agentId');
    const memoryTier = searchParams.get('memoryTier');
    const category = searchParams.get('category');
    const keyPattern = searchParams.get('keyPattern');
    const minImportance = searchParams.get('minImportance');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions
    const conditions = [eq(agentSharedMemory.workspaceId, workspaceId)];

    if (teamId) {
      conditions.push(eq(agentSharedMemory.teamId, teamId));
    }

    if (agentId) {
      conditions.push(eq(agentSharedMemory.agentId, agentId));
    }

    if (memoryTier) {
      conditions.push(eq(agentSharedMemory.memoryTier, memoryTier as typeof agentSharedMemory.memoryTier.enumValues[number]));
    }

    if (category) {
      conditions.push(eq(agentSharedMemory.category, category));
    }

    if (keyPattern) {
      conditions.push(like(agentSharedMemory.key, `%${keyPattern}%`));
    }

    if (minImportance) {
      conditions.push(gte(agentSharedMemory.importance, parseInt(minImportance)));
    }

    // Exclude expired memories
    conditions.push(
      or(
        isNull(agentSharedMemory.expiresAt),
        gte(agentSharedMemory.expiresAt, new Date())
      )!
    );

    // Fetch memories
    const memories = await db.query.agentSharedMemory.findMany({
      where: and(...conditions),
      orderBy: [desc(agentSharedMemory.importance), desc(agentSharedMemory.updatedAt)],
      limit,
      offset,
    });

    // Add agent/team names
    const memoriesWithDetails = await Promise.all(
      memories.map(async (mem) => {
        let agentName: string | null = null;
        let teamName: string | null = null;

        if (mem.agentId) {
          const agent = await db.query.agents.findFirst({
            where: eq(agents.id, mem.agentId),
          });
          agentName = agent?.name || null;
        }

        if (mem.teamId) {
          const team = await db.query.agentTeams.findFirst({
            where: eq(agentTeams.id, mem.teamId),
          });
          teamName = team?.name || null;
        }

        return {
          ...mem,
          agentName,
          teamName,
        };
      })
    );

    return NextResponse.json({
      memories: memoriesWithDetails,
      total: memoriesWithDetails.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('[Memory API] Failed to query memories', error);
    return NextResponse.json(
      { error: 'Failed to query memories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/memory
 * Store a new memory
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse and validate body
    const body = await request.json();
    const validation = storeMemorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { teamId, agentId, memoryTier, category, key, value, metadata, importance, expiresAt } = validation.data;

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
          { error: 'Team not found' },
          { status: 400 }
        );
      }
    }

    // Validate agent if provided
    if (agentId) {
      const agent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, agentId),
          eq(agents.workspaceId, workspaceId)
        ),
      });

      if (!agent) {
        return NextResponse.json(
          { error: 'Agent not found' },
          { status: 400 }
        );
      }
    }

    // Use memory service to store
    const memoryService = new AgentMemoryService(workspaceId);
    const memoryId = await memoryService.store({
      workspaceId,
      teamId,
      agentId,
      memoryTier,
      category,
      key,
      value,
      metadata,
      importance,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    logger.info('[Memory API] Memory stored', {
      memoryId,
      tier: memoryTier,
      category,
      key,
    });

    return NextResponse.json({
      success: true,
      memoryId,
      tier: memoryTier,
      category,
      key,
    }, { status: 201 });
  } catch (error) {
    logger.error('[Memory API] Failed to store memory', error);
    return NextResponse.json(
      { error: 'Failed to store memory' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orchestration/memory
 * Delete a memory
 */
export async function DELETE(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse and validate body
    const body = await request.json();
    const validation = deleteMemorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { memoryId } = validation.data;

    // Verify memory exists and belongs to workspace
    const memory = await db.query.agentSharedMemory.findFirst({
      where: and(
        eq(agentSharedMemory.id, memoryId),
        eq(agentSharedMemory.workspaceId, workspaceId)
      ),
    });

    if (!memory) {
      return NextResponse.json(
        { error: 'Memory not found' },
        { status: 404 }
      );
    }

    // Delete memory
    const memoryService = new AgentMemoryService(workspaceId);
    await memoryService.delete(memoryId);

    logger.info('[Memory API] Memory deleted', { memoryId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Memory API] Failed to delete memory', error);
    return NextResponse.json(
      { error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}
