/**
 * Unified Vector Database Interface
 * Supports both Pinecone and Upstash Vector
 */

import { Index as UpstashIndex } from '@upstash/vector';
import { Pinecone } from '@pinecone-database/pinecone';

export type VectorProvider = 'upstash' | 'pinecone';

// Determine which provider to use based on environment variables
const VECTOR_PROVIDER: VectorProvider = process.env.PINECONE_API_KEY
  ? 'pinecone'
  : process.env.UPSTASH_VECTOR_REST_URL
  ? 'upstash'
  : 'pinecone'; // Default to pinecone

/**
 * Get Upstash Vector client
 */
function getUpstashVector() {
  if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
    throw new Error('UPSTASH_VECTOR credentials not configured');
  }

  return new UpstashIndex({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
}

/**
 * Get Pinecone client
 */
function getPineconeVector() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY not configured');
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const indexName = process.env.PINECONE_INDEX || 'docs';
  return pinecone.index(indexName);
}

/**
 * Unified vector operations interface
 */
export interface VectorDocument {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface VectorQueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Upsert vectors to the database
 */
export async function upsertVectors(
  vectors: VectorDocument[]
): Promise<void> {
  if (VECTOR_PROVIDER === 'upstash') {
    const index = getUpstashVector();
    await index.upsert(
      vectors.map((v) => ({
        id: v.id,
        vector: v.values,
        metadata: v.metadata,
      }))
    );
  } else {
    const index = getPineconeVector();
    await index.upsert(vectors);
  }
}

/**
 * Query similar vectors
 */
export async function queryVectors(
  queryVector: number[],
  options?: {
    topK?: number;
    filter?: Record<string, any>;
    includeMetadata?: boolean;
  }
): Promise<VectorQueryResult[]> {
  const topK = options?.topK ?? 10;

  if (VECTOR_PROVIDER === 'upstash') {
    const index = getUpstashVector();
    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: options?.includeMetadata ?? true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter: options?.filter as any,
    });

    return results.map((r) => ({
      id: String(r.id),
      score: r.score,
      metadata: r.metadata as Record<string, any> | undefined,
    }));
  } else {
    const index = getPineconeVector();
    const results = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: options?.includeMetadata ?? true,
      filter: options?.filter,
    });

    return results.matches?.map((m) => ({
      id: m.id,
      score: m.score ?? 0,
      metadata: m.metadata,
    })) ?? [];
  }
}

/**
 * Delete vectors by ID
 */
export async function deleteVectors(ids: string[]): Promise<void> {
  if (VECTOR_PROVIDER === 'upstash') {
    const index = getUpstashVector();
    await index.delete(ids);
  } else {
    const index = getPineconeVector();
    await index.deleteMany(ids);
  }
}

/**
 * Get current vector provider
 */
export function getVectorProvider(): VectorProvider {
  return VECTOR_PROVIDER;
}

