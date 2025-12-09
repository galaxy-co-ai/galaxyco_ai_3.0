/**
 * Agent Memory Service - Three-Tier Memory System
 *
 * Implements a three-tier memory architecture for agent context sharing:
 * - Short-term: Session/task-specific context (auto-expires)
 * - Medium-term: Patterns and preferences (weeks to months)
 * - Long-term: Persistent knowledge and relationships
 *
 * Features:
 * - Context sharing between agents
 * - Memory promotion based on usage
 * - Automatic cleanup of expired memories
 * - Semantic relevance scoring
 */

import { db } from '@/lib/db';
import { agentSharedMemory } from '@/db/schema';
import { eq, and, desc, gte, lte, or, sql, like, isNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type {
  SharedMemory,
  StoreMemoryInput,
  MemoryQuery,
  MemoryTier,
  MemoryCategory,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

// Default expiration times for memory tiers
const MEMORY_EXPIRATION = {
  short_term: 24 * 60 * 60 * 1000, // 24 hours
  medium_term: 30 * 24 * 60 * 60 * 1000, // 30 days
  long_term: null, // Never expires
};

// Importance thresholds for promotion
const PROMOTION_THRESHOLDS = {
  short_to_medium: 70, // Promote if importance >= 70 and accessed 3+ times
  medium_to_long: 85, // Promote if importance >= 85 and accessed 10+ times
};

// ============================================================================
// MEMORY SERVICE CLASS
// ============================================================================

export class AgentMemoryService {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ==========================================================================
  // STORE MEMORY
  // ==========================================================================

  /**
   * Store a memory entry with the appropriate tier
   */
  async store(input: StoreMemoryInput): Promise<string> {
    try {
      logger.info('[MemoryService] Storing memory', {
        workspaceId: this.workspaceId,
        tier: input.memoryTier,
        category: input.category,
        key: input.key,
      });

      // Calculate expiration based on tier if not provided
      let expiresAt = input.expiresAt;
      if (!expiresAt && MEMORY_EXPIRATION[input.memoryTier]) {
        expiresAt = new Date(Date.now() + MEMORY_EXPIRATION[input.memoryTier]!);
      }

      // Check if memory with same key exists
      const existing = await db.query.agentSharedMemory.findFirst({
        where: and(
          eq(agentSharedMemory.workspaceId, this.workspaceId),
          eq(agentSharedMemory.key, input.key),
          input.teamId ? eq(agentSharedMemory.teamId, input.teamId) : isNull(agentSharedMemory.teamId),
          input.agentId ? eq(agentSharedMemory.agentId, input.agentId) : isNull(agentSharedMemory.agentId)
        ),
      });

      if (existing) {
        // Update existing memory
        await db
          .update(agentSharedMemory)
          .set({
            value: input.value,
            metadata: {
              ...(existing.metadata as Record<string, unknown> || {}),
              ...input.metadata,
              lastAccessed: new Date().toISOString(),
              accessCount: ((existing.metadata as { accessCount?: number })?.accessCount || 0) + 1,
            },
            importance: input.importance ?? existing.importance,
            expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(agentSharedMemory.id, existing.id));

        return existing.id;
      }

      // Create new memory
      const [memory] = await db
        .insert(agentSharedMemory)
        .values({
          workspaceId: this.workspaceId,
          teamId: input.teamId,
          agentId: input.agentId,
          memoryTier: input.memoryTier,
          category: input.category,
          key: input.key,
          value: input.value,
          metadata: {
            ...input.metadata,
            accessCount: 0,
          },
          importance: input.importance ?? 50,
          expiresAt,
        })
        .returning();

      return memory.id;
    } catch (error) {
      logger.error('[MemoryService] Failed to store memory', error);
      throw error;
    }
  }

  // ==========================================================================
  // RETRIEVE MEMORY
  // ==========================================================================

  /**
   * Retrieve relevant memories based on query
   */
  async retrieve(query: MemoryQuery): Promise<SharedMemory[]> {
    try {
      const conditions = [eq(agentSharedMemory.workspaceId, this.workspaceId)];

      // Filter by scope (team or agent)
      if (query.teamId) {
        conditions.push(eq(agentSharedMemory.teamId, query.teamId));
      }

      if (query.agentId) {
        conditions.push(eq(agentSharedMemory.agentId, query.agentId));
      }

      // Filter by tier
      if (query.memoryTier) {
        conditions.push(eq(agentSharedMemory.memoryTier, query.memoryTier));
      }

      // Filter by category
      if (query.category) {
        conditions.push(eq(agentSharedMemory.category, query.category));
      }

      // Filter by key pattern (simple LIKE search)
      if (query.keyPattern) {
        conditions.push(like(agentSharedMemory.key, `%${query.keyPattern}%`));
      }

      // Filter by minimum importance
      if (query.minImportance !== undefined) {
        conditions.push(gte(agentSharedMemory.importance, query.minImportance));
      }

      // Exclude expired memories
      conditions.push(
        or(
          isNull(agentSharedMemory.expiresAt),
          gte(agentSharedMemory.expiresAt, new Date())
        )!
      );

      const limit = query.limit || 50;

      const memories = await db.query.agentSharedMemory.findMany({
        where: and(...conditions),
        orderBy: [desc(agentSharedMemory.importance), desc(agentSharedMemory.updatedAt)],
        limit,
      });

      // Update access count for retrieved memories
      for (const memory of memories) {
        await this.recordAccess(memory.id);
      }

      return memories.map((m) => this.transformMemory(m));
    } catch (error) {
      logger.error('[MemoryService] Failed to retrieve memories', error);
      return [];
    }
  }

  /**
   * Get a specific memory by key
   */
  async get(
    key: string,
    options?: { teamId?: string; agentId?: string }
  ): Promise<SharedMemory | null> {
    try {
      const conditions = [
        eq(agentSharedMemory.workspaceId, this.workspaceId),
        eq(agentSharedMemory.key, key),
      ];

      if (options?.teamId) {
        conditions.push(eq(agentSharedMemory.teamId, options.teamId));
      }

      if (options?.agentId) {
        conditions.push(eq(agentSharedMemory.agentId, options.agentId));
      }

      // Exclude expired
      conditions.push(
        or(
          isNull(agentSharedMemory.expiresAt),
          gte(agentSharedMemory.expiresAt, new Date())
        )!
      );

      const memory = await db.query.agentSharedMemory.findFirst({
        where: and(...conditions),
      });

      if (memory) {
        await this.recordAccess(memory.id);
        return this.transformMemory(memory);
      }

      return null;
    } catch (error) {
      logger.error('[MemoryService] Failed to get memory', error);
      return null;
    }
  }

  // ==========================================================================
  // MEMORY PROMOTION
  // ==========================================================================

  /**
   * Promote a memory to a higher tier based on usage
   */
  async promoteMemory(memoryId: string): Promise<boolean> {
    try {
      const memory = await db.query.agentSharedMemory.findFirst({
        where: and(
          eq(agentSharedMemory.id, memoryId),
          eq(agentSharedMemory.workspaceId, this.workspaceId)
        ),
      });

      if (!memory) {
        return false;
      }

      const metadata = memory.metadata as { accessCount?: number } | null;
      const accessCount = metadata?.accessCount || 0;
      let newTier: MemoryTier | null = null;
      let newExpiration: Date | null = null;

      // Check promotion criteria
      if (
        memory.memoryTier === 'short_term' &&
        memory.importance >= PROMOTION_THRESHOLDS.short_to_medium &&
        accessCount >= 3
      ) {
        newTier = 'medium_term';
        newExpiration = new Date(Date.now() + MEMORY_EXPIRATION.medium_term!);
      } else if (
        memory.memoryTier === 'medium_term' &&
        memory.importance >= PROMOTION_THRESHOLDS.medium_to_long &&
        accessCount >= 10
      ) {
        newTier = 'long_term';
        newExpiration = null; // Long-term never expires
      }

      if (newTier) {
        await db
          .update(agentSharedMemory)
          .set({
            memoryTier: newTier,
            expiresAt: newExpiration,
            updatedAt: new Date(),
          })
          .where(eq(agentSharedMemory.id, memoryId));

        logger.info('[MemoryService] Memory promoted', {
          memoryId,
          fromTier: memory.memoryTier,
          toTier: newTier,
        });

        return true;
      }

      return false;
    } catch (error) {
      logger.error('[MemoryService] Failed to promote memory', error);
      return false;
    }
  }

  /**
   * Check and promote all eligible memories
   */
  async checkPromotions(): Promise<number> {
    try {
      const shortTermMemories = await db.query.agentSharedMemory.findMany({
        where: and(
          eq(agentSharedMemory.workspaceId, this.workspaceId),
          eq(agentSharedMemory.memoryTier, 'short_term'),
          gte(agentSharedMemory.importance, PROMOTION_THRESHOLDS.short_to_medium)
        ),
      });

      const mediumTermMemories = await db.query.agentSharedMemory.findMany({
        where: and(
          eq(agentSharedMemory.workspaceId, this.workspaceId),
          eq(agentSharedMemory.memoryTier, 'medium_term'),
          gte(agentSharedMemory.importance, PROMOTION_THRESHOLDS.medium_to_long)
        ),
      });

      let promotedCount = 0;

      for (const memory of [...shortTermMemories, ...mediumTermMemories]) {
        const promoted = await this.promoteMemory(memory.id);
        if (promoted) promotedCount++;
      }

      return promotedCount;
    } catch (error) {
      logger.error('[MemoryService] Failed to check promotions', error);
      return 0;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Clean up expired short-term memories
   */
  async cleanup(): Promise<number> {
    try {
      const now = new Date();

      const result = await db
        .delete(agentSharedMemory)
        .where(
          and(
            eq(agentSharedMemory.workspaceId, this.workspaceId),
            lte(agentSharedMemory.expiresAt, now)
          )
        )
        .returning();

      const deletedCount = result.length;

      if (deletedCount > 0) {
        logger.info('[MemoryService] Cleaned up expired memories', {
          workspaceId: this.workspaceId,
          deletedCount,
        });
      }

      return deletedCount;
    } catch (error) {
      logger.error('[MemoryService] Failed to cleanup', error);
      return 0;
    }
  }

  // ==========================================================================
  // CONTEXT SHARING
  // ==========================================================================

  /**
   * Share context from one agent to another
   */
  async shareContext(
    fromAgentId: string,
    toAgentId: string,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      logger.info('[MemoryService] Sharing context', {
        fromAgentId,
        toAgentId,
        contextKeys: Object.keys(context),
      });

      // Store context for the receiving agent
      await this.store({
        workspaceId: this.workspaceId,
        agentId: toAgentId,
        memoryTier: 'short_term',
        category: 'context',
        key: `shared_from_${fromAgentId}_${Date.now()}`,
        value: context,
        metadata: {
          source: `agent:${fromAgentId}`,
        },
        importance: 60,
      });
    } catch (error) {
      logger.error('[MemoryService] Failed to share context', error);
      throw error;
    }
  }

  /**
   * Get shared context for an agent
   */
  async getSharedContext(agentId: string): Promise<Record<string, unknown>> {
    try {
      const memories = await this.retrieve({
        workspaceId: this.workspaceId,
        agentId,
        category: 'context',
        memoryTier: 'short_term',
        limit: 20,
      });

      // Merge all context memories
      const context: Record<string, unknown> = {};
      for (const memory of memories) {
        if (typeof memory.value === 'object' && memory.value !== null) {
          Object.assign(context, memory.value);
        }
      }

      return context;
    } catch (error) {
      logger.error('[MemoryService] Failed to get shared context', error);
      return {};
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Record memory access (for usage tracking and promotion)
   */
  private async recordAccess(memoryId: string): Promise<void> {
    try {
      const memory = await db.query.agentSharedMemory.findFirst({
        where: eq(agentSharedMemory.id, memoryId),
      });

      if (!memory) return;

      const metadata = memory.metadata as { accessCount?: number } | null;
      const currentCount = metadata?.accessCount || 0;

      await db
        .update(agentSharedMemory)
        .set({
          metadata: {
            ...(memory.metadata as Record<string, unknown> || {}),
            lastAccessed: new Date().toISOString(),
            accessCount: currentCount + 1,
          },
        })
        .where(eq(agentSharedMemory.id, memoryId));
    } catch (error) {
      // Don't throw on access recording failure
      logger.warn('[MemoryService] Failed to record access', { memoryId, error });
    }
  }

  /**
   * Update memory importance
   */
  async updateImportance(memoryId: string, importance: number): Promise<void> {
    try {
      await db
        .update(agentSharedMemory)
        .set({
          importance: Math.max(0, Math.min(100, importance)),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(agentSharedMemory.id, memoryId),
            eq(agentSharedMemory.workspaceId, this.workspaceId)
          )
        );
    } catch (error) {
      logger.error('[MemoryService] Failed to update importance', error);
    }
  }

  /**
   * Delete a memory
   */
  async delete(memoryId: string): Promise<void> {
    try {
      await db
        .delete(agentSharedMemory)
        .where(
          and(
            eq(agentSharedMemory.id, memoryId),
            eq(agentSharedMemory.workspaceId, this.workspaceId)
          )
        );
    } catch (error) {
      logger.error('[MemoryService] Failed to delete memory', error);
    }
  }

  /**
   * Transform database memory to API type
   */
  private transformMemory(mem: typeof agentSharedMemory.$inferSelect): SharedMemory {
    return {
      id: mem.id,
      workspaceId: mem.workspaceId,
      teamId: mem.teamId || undefined,
      agentId: mem.agentId || undefined,
      memoryTier: mem.memoryTier as MemoryTier,
      category: mem.category as MemoryCategory,
      key: mem.key,
      value: mem.value,
      metadata: (mem.metadata || {}) as SharedMemory['metadata'],
      importance: mem.importance,
      expiresAt: mem.expiresAt || undefined,
      createdAt: mem.createdAt,
      updatedAt: mem.updatedAt,
    };
  }
}

