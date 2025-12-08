/**
 * AI Response Caching Module
 * 
 * Implements semantic caching for AI responses to reduce API costs
 * and improve response times for similar queries.
 */

import { redis, shouldUseRedis } from '@/lib/upstash';
import { generateEmbedding, isVectorConfigured } from '@/lib/vector';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface CachedResponse {
  query: string;
  response: string;
  toolsUsed: string[];
  metadata?: Record<string, unknown>;
  timestamp: number;
  ttl: number;
}

interface CacheEntry {
  embedding: number[];
  data: CachedResponse;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  // Minimum similarity score to consider a cache hit (0.90 = 90% similar)
  // Lowered from 0.95 to increase cache hit rate while maintaining quality
  minSimilarity: 0.90,
  // Default TTL in seconds (1 hour)
  defaultTTL: 3600,
  // Maximum cached entries per workspace
  maxEntriesPerWorkspace: 100,
  // Cache key prefix
  keyPrefix: 'ai:cache:',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Get cache key for a workspace
 */
function getCacheKey(workspaceId: string): string {
  return `${CACHE_CONFIG.keyPrefix}${workspaceId}`;
}

// ============================================================================
// MAIN CACHING FUNCTIONS
// ============================================================================

/**
 * Check if caching is available
 */
export function isCacheAvailable(): boolean {
  return shouldUseRedis() && !!redis && isVectorConfigured();
}

/**
 * Get a cached response for a query if similar enough exists
 * 
 * @param query - The user's query
 * @param workspaceId - The workspace ID
 * @returns Cached response or null if no match
 */
export async function getCachedResponse(
  query: string,
  workspaceId: string
): Promise<CachedResponse | null> {
  if (!isCacheAvailable()) {
    return null;
  }

  try {
    if (!redis) return null;
    
    const cacheKey = getCacheKey(workspaceId);
    
    // Get all cached entries for this workspace
    const cached = await redis.get<CacheEntry[]>(cacheKey);
    
    if (!cached || cached.length === 0) {
      return null;
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Find the most similar cached entry
    let bestMatch: { entry: CacheEntry; similarity: number } | null = null;

    for (const entry of cached) {
      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      
      if (similarity >= CACHE_CONFIG.minSimilarity) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { entry, similarity };
        }
      }
    }

    if (bestMatch) {
      // Check if entry is still valid (not expired)
      const now = Date.now();
      const age = now - bestMatch.entry.data.timestamp;
      
      if (age < bestMatch.entry.data.ttl * 1000) {
        logger.info('[AI Cache] Cache hit', {
          workspaceId,
          similarity: bestMatch.similarity.toFixed(3),
          age: `${Math.round(age / 1000)}s`,
        });
        return bestMatch.entry.data;
      }
    }

    return null;
  } catch (error) {
    logger.error('[AI Cache] Failed to get cached response', error);
    return null;
  }
}

/**
 * Cache an AI response for future similar queries
 * 
 * @param query - The user's query
 * @param response - The AI response
 * @param workspaceId - The workspace ID
 * @param options - Additional options
 */
export async function cacheResponse(
  query: string,
  response: string,
  workspaceId: string,
  options: {
    toolsUsed?: string[];
    metadata?: Record<string, unknown>;
    ttl?: number;
  } = {}
): Promise<void> {
  if (!isCacheAvailable()) {
    return;
  }

  // Don't cache very short queries or responses
  if (query.length < 10 || response.length < 50) {
    return;
  }

  // Don't cache queries that likely need fresh data
  // Reduced to only truly time-sensitive patterns
  const skipPatterns = [
    'today', 'now', 'right now', 'this moment',
    'schedule', 'calendar', 'meeting', 'appointment',
    'create', 'add', 'update', 'delete', 'send', 'post',
  ];
  
  const lowerQuery = query.toLowerCase();
  // Only skip if pattern appears as a standalone word or at start
  const shouldSkip = skipPatterns.some(pattern => {
    const regex = new RegExp(`(^|\\s)${pattern}(\\s|$)`, 'i');
    return regex.test(lowerQuery);
  });
  
  if (shouldSkip) {
    logger.debug('[AI Cache] Skipping cache for time-sensitive or action query', {
      pattern: skipPatterns.find(p => lowerQuery.includes(p)),
    });
    return;
  }

  try {
    if (!redis) return;
    
    const cacheKey = getCacheKey(workspaceId);
    
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    // Get existing cache
    let cached = await redis.get<CacheEntry[]>(cacheKey) || [];
    
    // Remove expired entries
    const now = Date.now();
    cached = cached.filter((entry: CacheEntry) => {
      const age = now - entry.data.timestamp;
      return age < entry.data.ttl * 1000;
    });

    // Check if a very similar entry already exists
    for (const entry of cached) {
      const similarity = cosineSimilarity(embedding, entry.embedding);
      if (similarity >= 0.99) {
        // Update existing entry instead of adding duplicate
        entry.data = {
          query,
          response,
          toolsUsed: options.toolsUsed || [],
          metadata: options.metadata,
          timestamp: now,
          ttl: options.ttl || CACHE_CONFIG.defaultTTL,
        };
        
        await redis.set(cacheKey, cached, {
          ex: CACHE_CONFIG.defaultTTL * 2, // Redis TTL longer than individual entry TTL
        });
        
        logger.debug('[AI Cache] Updated existing cache entry');
        return;
      }
    }

    // Add new entry
    const newEntry: CacheEntry = {
      embedding,
      data: {
        query,
        response,
        toolsUsed: options.toolsUsed || [],
        metadata: options.metadata,
        timestamp: now,
        ttl: options.ttl || CACHE_CONFIG.defaultTTL,
      },
    };

    cached.push(newEntry);

    // Limit cache size per workspace
    if (cached.length > CACHE_CONFIG.maxEntriesPerWorkspace) {
      // Remove oldest entries
      cached.sort((a: CacheEntry, b: CacheEntry) => b.data.timestamp - a.data.timestamp);
      cached = cached.slice(0, CACHE_CONFIG.maxEntriesPerWorkspace);
    }

    await redis.set(cacheKey, cached, {
      ex: CACHE_CONFIG.defaultTTL * 2,
    });

    logger.info('[AI Cache] Response cached', {
      workspaceId,
      queryLength: query.length,
      responseLength: response.length,
      totalCached: cached.length,
    });
  } catch (error) {
    logger.error('[AI Cache] Failed to cache response', error);
    // Non-blocking - don't throw
  }
}

/**
 * Invalidate cache for a workspace
 * Call this when data changes that might affect cached responses
 * 
 * @param workspaceId - The workspace ID
 */
export async function invalidateCache(workspaceId: string): Promise<void> {
  if (!shouldUseRedis() || !redis) {
    return;
  }

  try {
    const cacheKey = getCacheKey(workspaceId);
    await redis.del(cacheKey);
    
    logger.info('[AI Cache] Cache invalidated', { workspaceId });
  } catch (error) {
    logger.error('[AI Cache] Failed to invalidate cache', error);
  }
}

/**
 * Get cache statistics for a workspace
 */
export async function getCacheStats(workspaceId: string): Promise<{
  entries: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  if (!shouldUseRedis() || !redis) {
    return { entries: 0, oldestEntry: null, newestEntry: null };
  }

  try {
    const cacheKey = getCacheKey(workspaceId);
    const cached = await redis.get<CacheEntry[]>(cacheKey);
    
    if (!cached || cached.length === 0) {
      return { entries: 0, oldestEntry: null, newestEntry: null };
    }

    const timestamps = cached.map((e: CacheEntry) => e.data.timestamp);
    
    return {
      entries: cached.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps),
    };
  } catch (error) {
    logger.error('[AI Cache] Failed to get cache stats', error);
    return { entries: 0, oldestEntry: null, newestEntry: null };
  }
}
