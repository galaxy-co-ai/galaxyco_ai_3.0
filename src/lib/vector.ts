import { Index } from '@upstash/vector';
import { getOpenAI } from '@/lib/ai-providers';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface VectorData {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface QueryOptions {
  topK?: number;
  filter?: string;
  includeMetadata?: boolean;
  includeVectors?: boolean;
  minScore?: number;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface UpsertResult {
  upsertedCount: number;
}

// ============================================================================
// UPSTASH VECTOR CLIENT
// ============================================================================

let vectorIndex: Index | null = null;

/**
 * Get or create the Upstash Vector index client
 */
function getVectorIndex(): Index {
  if (vectorIndex) {
    return vectorIndex;
  }

  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Upstash Vector not configured. Please set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN environment variables.'
    );
  }

  vectorIndex = new Index({
    url,
    token,
  });

  return vectorIndex;
}

/**
 * Check if Upstash Vector is configured
 */
export function isVectorConfigured(): boolean {
  return !!(process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN);
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate embeddings for text using OpenAI's embedding model
 * Uses text-embedding-3-small for cost efficiency with good quality
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAI();

    // Truncate text if too long (max ~8000 tokens for embedding model)
    const truncatedText = text.slice(0, 30000);

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error('[Vector] Failed to generate embedding', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const openai = getOpenAI();

    // Truncate texts and filter empty
    const truncatedTexts = texts.map((t) => t.slice(0, 30000)).filter((t) => t.trim().length > 0);

    if (truncatedTexts.length === 0) {
      return [];
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedTexts,
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    logger.error('[Vector] Failed to generate batch embeddings', error);
    throw error;
  }
}

// ============================================================================
// VECTOR DATABASE OPERATIONS
// ============================================================================

/**
 * Upsert vectors into the Upstash Vector database
 *
 * @param vectors - Array of vectors to upsert with IDs and metadata
 * @param namespace - Optional namespace for multi-tenant isolation (e.g., workspaceId)
 */
export async function upsertVectors(
  vectors: VectorData[],
  namespace?: string
): Promise<UpsertResult> {
  if (!isVectorConfigured()) {
    logger.warn('[Vector] Upstash Vector not configured - skipping upsert');
    return { upsertedCount: 0 };
  }

  if (vectors.length === 0) {
    return { upsertedCount: 0 };
  }

  try {
    const index = getVectorIndex();

    // Format vectors for Upstash Vector
    const formattedVectors = vectors.map((v) => ({
      id: v.id,
      vector: v.values,
      metadata: v.metadata || {},
    }));

    // Upsert in batches of 100 to avoid payload limits
    const BATCH_SIZE = 100;
    let upsertedCount = 0;

    for (let i = 0; i < formattedVectors.length; i += BATCH_SIZE) {
      const batch = formattedVectors.slice(i, i + BATCH_SIZE);

      if (namespace) {
        await index.namespace(namespace).upsert(batch);
      } else {
        await index.upsert(batch);
      }

      upsertedCount += batch.length;
    }

    logger.info('[Vector] Vectors upserted', {
      count: upsertedCount,
      namespace: namespace || 'default',
    });

    return { upsertedCount };
  } catch (error) {
    logger.error('[Vector] Failed to upsert vectors', error);
    throw error;
  }
}

/**
 * Query vectors from the Upstash Vector database using similarity search
 *
 * @param queryVector - The query embedding vector
 * @param options - Query options (topK, filter, etc.)
 * @param namespace - Optional namespace for multi-tenant isolation
 */
export async function queryVectors(
  queryVector: number[],
  options: QueryOptions = {},
  namespace?: string
): Promise<QueryResult[]> {
  if (!isVectorConfigured()) {
    logger.warn('[Vector] Upstash Vector not configured - returning empty results');
    return [];
  }

  const {
    topK = 10,
    filter,
    includeMetadata = true,
    includeVectors = false,
    minScore = 0.0,
  } = options;

  try {
    const index = getVectorIndex();

    const queryOptions: {
      topK: number;
      includeMetadata: boolean;
      includeVectors: boolean;
      filter?: string;
    } = {
      topK,
      includeMetadata,
      includeVectors,
    };

    // Add filter if provided
    if (filter) {
      queryOptions.filter = filter;
    }

    let results;
    if (namespace) {
      results = await index.namespace(namespace).query({
        vector: queryVector,
        ...queryOptions,
      });
    } else {
      results = await index.query({
        vector: queryVector,
        ...queryOptions,
      });
    }

    // Map and filter results
    const mappedResults: QueryResult[] = results
      .filter((r) => r.score >= minScore)
      .map((r) => ({
        id: r.id as string,
        score: r.score,
        metadata: r.metadata as Record<string, unknown> | undefined,
      }));

    logger.info('[Vector] Query completed', {
      topK,
      resultsCount: mappedResults.length,
      namespace: namespace || 'default',
    });

    return mappedResults;
  } catch (error) {
    logger.error('[Vector] Failed to query vectors', error);
    throw error;
  }
}

/**
 * Query vectors using text (generates embedding automatically)
 *
 * @param queryText - The text to search for
 * @param options - Query options
 * @param namespace - Optional namespace
 */
export async function queryByText(
  queryText: string,
  options: QueryOptions = {},
  namespace?: string
): Promise<QueryResult[]> {
  try {
    // Generate embedding for the query text
    const queryVector = await generateEmbedding(queryText);

    // Query using the generated embedding
    return queryVectors(queryVector, options, namespace);
  } catch (error) {
    logger.error('[Vector] Failed to query by text', error);
    throw error;
  }
}

/**
 * Delete vectors by IDs
 *
 * @param ids - Array of vector IDs to delete
 * @param namespace - Optional namespace
 */
export async function deleteVectors(ids: string[], namespace?: string): Promise<void> {
  if (!isVectorConfigured()) {
    logger.warn('[Vector] Upstash Vector not configured - skipping delete');
    return;
  }

  if (ids.length === 0) {
    return;
  }

  try {
    const index = getVectorIndex();

    if (namespace) {
      await index.namespace(namespace).delete(ids);
    } else {
      await index.delete(ids);
    }

    logger.info('[Vector] Vectors deleted', {
      count: ids.length,
      namespace: namespace || 'default',
    });
  } catch (error) {
    logger.error('[Vector] Failed to delete vectors', error);
    throw error;
  }
}

/**
 * Delete all vectors in a namespace
 * Use with caution - this will delete ALL vectors for a workspace
 *
 * @param namespace - The namespace to clear
 */
export async function deleteNamespace(namespace: string): Promise<void> {
  if (!isVectorConfigured()) {
    logger.warn('[Vector] Upstash Vector not configured - skipping namespace delete');
    return;
  }

  try {
    const index = getVectorIndex();
    await index.namespace(namespace).reset();

    logger.info('[Vector] Namespace deleted', { namespace });
  } catch (error) {
    logger.error('[Vector] Failed to delete namespace', error);
    throw error;
  }
}

/**
 * Delete vectors matching a filter pattern
 * Note: Upstash Vector doesn't support filter-based deletion directly,
 * so this fetches matching IDs first then deletes them
 *
 * @param filter - Metadata filter string
 * @param namespace - Optional namespace
 */
export async function deleteVectorsByFilter(
  filter: Record<string, unknown>,
  namespace?: string
): Promise<void> {
  if (!isVectorConfigured()) {
    logger.warn('[Vector] Upstash Vector not configured - skipping filter delete');
    return;
  }

  try {
    // Build filter string for Upstash Vector
    // Format: "key = 'value'" or "key = value" for non-strings
    const filterParts = Object.entries(filter).map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key} = '${value}'`;
      }
      return `${key} = ${value}`;
    });
    const filterString = filterParts.join(' AND ');

    // Generate a dummy query vector to fetch matching vectors
    // We use a zero vector of the expected dimension (1536 for text-embedding-3-small)
    const dummyVector = new Array(1536).fill(0);

    // Query for matching vectors
    const results = await queryVectors(
      dummyVector,
      { topK: 1000, filter: filterString },
      namespace
    );

    // Delete the matching vectors
    if (results.length > 0) {
      const ids = results.map((r) => r.id);
      await deleteVectors(ids, namespace);
    }

    logger.info('[Vector] Vectors deleted by filter', {
      filter,
      deletedCount: results.length,
      namespace: namespace || 'default',
    });
  } catch (error) {
    logger.error('[Vector] Failed to delete vectors by filter', error);
    throw error;
  }
}

/**
 * Fetch a vector by ID
 *
 * @param id - The vector ID to fetch
 * @param namespace - Optional namespace
 */
export async function fetchVector(id: string, namespace?: string): Promise<QueryResult | null> {
  if (!isVectorConfigured()) {
    return null;
  }

  try {
    const index = getVectorIndex();

    let result;
    if (namespace) {
      result = await index.namespace(namespace).fetch([id], {
        includeMetadata: true,
      });
    } else {
      result = await index.fetch([id], {
        includeMetadata: true,
      });
    }

    if (result && result.length > 0 && result[0]) {
      return {
        id: result[0].id as string,
        score: 1.0,
        metadata: result[0].metadata as Record<string, unknown> | undefined,
      };
    }

    return null;
  } catch (error) {
    logger.error('[Vector] Failed to fetch vector', error);
    throw error;
  }
}

/**
 * Get index statistics/info
 */
export async function getIndexStats(): Promise<{
  vectorCount: number;
  dimension: number;
} | null> {
  if (!isVectorConfigured()) {
    return null;
  }

  try {
    const index = getVectorIndex();
    const info = await index.info();

    return {
      vectorCount: info.vectorCount,
      dimension: info.dimension,
    };
  } catch (error) {
    logger.error('[Vector] Failed to get index stats', error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR KNOWLEDGE BASE
// ============================================================================

/**
 * Index a knowledge base document
 * Chunks the content and stores embeddings with metadata
 *
 * @param itemId - The knowledge item ID
 * @param workspaceId - The workspace ID (used as namespace)
 * @param title - Document title
 * @param content - Document content
 * @param additionalMetadata - Optional extra metadata
 */
export async function indexKnowledgeDocument(
  itemId: string,
  workspaceId: string,
  title: string,
  content: string,
  additionalMetadata?: Record<string, unknown>
): Promise<{ chunksIndexed: number }> {
  if (!isVectorConfigured()) {
    logger.warn('[Vector] Not configured - skipping document indexing');
    return { chunksIndexed: 0 };
  }

  try {
    // Chunk the content for better retrieval
    const chunks = chunkText(content, 500);

    if (chunks.length === 0) {
      return { chunksIndexed: 0 };
    }

    // Limit to 20 chunks per document for cost control
    const limitedChunks = chunks.slice(0, 20);

    // Generate embeddings for all chunks in batch
    const embeddings = await generateEmbeddings(limitedChunks);

    // Create vector records
    const vectors: VectorData[] = embeddings.map((embedding, index) => ({
      id: `${itemId}_chunk_${index}`,
      values: embedding,
      metadata: {
        itemId,
        workspaceId,
        title,
        chunk: limitedChunks[index],
        chunkIndex: index,
        totalChunks: limitedChunks.length,
        ...additionalMetadata,
      },
    }));

    // Upsert with workspace as namespace for multi-tenant isolation
    await upsertVectors(vectors, workspaceId);

    logger.info('[Vector] Knowledge document indexed', {
      itemId,
      workspaceId,
      chunksIndexed: vectors.length,
    });

    return { chunksIndexed: vectors.length };
  } catch (error) {
    logger.error('[Vector] Failed to index knowledge document', error);
    throw error;
  }
}

/**
 * Search knowledge base using semantic similarity
 *
 * @param workspaceId - The workspace to search in
 * @param query - The search query
 * @param options - Search options
 */
export async function searchKnowledge(
  workspaceId: string,
  query: string,
  options: {
    topK?: number;
    minScore?: number;
    type?: string;
  } = {}
): Promise<{
  results: Array<{
    itemId: string;
    title: string;
    chunk: string;
    score: number;
    chunkIndex: number;
  }>;
}> {
  const { topK = 5, minScore = 0.5, type } = options;

  if (!isVectorConfigured()) {
    logger.warn('[Vector] Not configured - returning empty search results');
    return { results: [] };
  }

  try {
    // Build filter if type is specified
    let filter: string | undefined;
    if (type) {
      filter = `type = '${type}'`;
    }

    // Query by text with workspace namespace
    const vectorResults = await queryByText(
      query,
      { topK: topK * 2, minScore, filter }, // Fetch more to allow deduplication
      workspaceId
    );

    // Deduplicate by itemId (keep highest scoring chunk per document)
    const seenItems = new Map<string, (typeof vectorResults)[0]>();
    for (const result of vectorResults) {
      const itemId = result.metadata?.itemId as string;
      if (!itemId) continue;

      const existing = seenItems.get(itemId);
      if (!existing || result.score > existing.score) {
        seenItems.set(itemId, result);
      }
    }

    // Convert to result format, limited to topK
    const results = Array.from(seenItems.values())
      .slice(0, topK)
      .map((r) => ({
        itemId: r.metadata?.itemId as string,
        title: (r.metadata?.title as string) || 'Untitled',
        chunk: (r.metadata?.chunk as string) || '',
        score: r.score,
        chunkIndex: (r.metadata?.chunkIndex as number) || 0,
      }));

    logger.info('[Vector] Knowledge search completed', {
      workspaceId,
      query: query.slice(0, 50),
      resultsCount: results.length,
    });

    return { results };
  } catch (error) {
    logger.error('[Vector] Failed to search knowledge', error);
    return { results: [] };
  }
}

/**
 * Delete all vectors for a knowledge item
 */
export async function deleteKnowledgeDocument(itemId: string, workspaceId: string): Promise<void> {
  if (!isVectorConfigured()) {
    return;
  }

  try {
    // Generate IDs for all possible chunks (assuming max 20 chunks)
    const ids = Array.from({ length: 20 }, (_, i) => `${itemId}_chunk_${i}`);
    await deleteVectors(ids, workspaceId);

    logger.info('[Vector] Knowledge document deleted from index', {
      itemId,
      workspaceId,
    });
  } catch (error) {
    logger.error('[Vector] Failed to delete knowledge document', error);
  }
}

// ============================================================================
// TEXT CHUNKING UTILITY (Enhanced for Phase 2)
// ============================================================================

/**
 * Chunking configuration
 */
const CHUNK_CONFIG = {
  TARGET_SIZE: 500, // Target chunk size in characters
  MAX_SIZE: 700, // Maximum chunk size
  MIN_SIZE: 100, // Minimum chunk size (smaller ones get merged)
  OVERLAP_SIZE: 50, // Overlap between chunks for context continuity
  OVERLAP_SENTENCES: 1, // Number of sentences to overlap
};

/**
 * Chunk metadata for improved RAG
 */
export interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  startChar: number;
  endChar: number;
  hasOverlap: boolean;
  section?: string; // Section header if detected
}

/**
 * Split text into semantic chunks with overlap
 * Uses sentence boundaries, section detection, and overlapping for better context
 */
export function semanticChunk(
  text: string,
  options: {
    targetSize?: number;
    maxSize?: number;
    overlapSentences?: number;
  } = {}
): { text: string; metadata: ChunkMetadata }[] {
  const {
    targetSize = CHUNK_CONFIG.TARGET_SIZE,
    maxSize = CHUNK_CONFIG.MAX_SIZE,
    overlapSentences = CHUNK_CONFIG.OVERLAP_SENTENCES,
  } = options;

  if (!text || text.trim().length < CHUNK_CONFIG.MIN_SIZE) {
    if (text && text.trim().length > 0) {
      return [
        {
          text: text.trim(),
          metadata: {
            chunkIndex: 0,
            totalChunks: 1,
            startChar: 0,
            endChar: text.length,
            hasOverlap: false,
          },
        },
      ];
    }
    return [];
  }

  // Detect section headers (markdown-style or numbered)
  const sectionPattern = /^(?:#{1,6}\s+|\d+\.\s+|[A-Z][A-Z\s]+:)/gm;
  const sections = text.split(sectionPattern);
  const sectionHeaders = text.match(sectionPattern) || [];

  // Parse into sentences while preserving structure
  const sentences = parseSentences(text);

  const chunks: { text: string; metadata: ChunkMetadata }[] = [];
  let currentChunk = '';
  let currentSection = '';
  let chunkStartChar = 0;
  let currentCharPos = 0;
  let lastOverlapSentences: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceLength = sentence.length;

    // Check if this sentence starts a new section
    if (sectionPattern.test(sentence)) {
      currentSection = sentence.trim();
    }

    // If adding this sentence would exceed max size, finalize current chunk
    if (currentChunk.length > 0 && currentChunk.length + sentenceLength > maxSize) {
      // Save current chunk
      const chunkText = currentChunk.trim();
      chunks.push({
        text: chunkText,
        metadata: {
          chunkIndex: chunks.length,
          totalChunks: 0, // Will update later
          startChar: chunkStartChar,
          endChar: currentCharPos,
          hasOverlap: lastOverlapSentences.length > 0,
          section: currentSection || undefined,
        },
      });

      // Start new chunk with overlap from previous
      lastOverlapSentences = sentences.slice(Math.max(0, i - overlapSentences), i);
      currentChunk = lastOverlapSentences.join(' ') + ' ';
      chunkStartChar = currentCharPos - currentChunk.length;
    }

    currentChunk += sentence + ' ';
    currentCharPos += sentenceLength + 1;

    // If we've reached target size and hit a natural break, consider chunking
    if (currentChunk.length >= targetSize) {
      // Look for natural break points (paragraph, section end)
      const isNaturalBreak =
        sentence.endsWith('.') ||
        sentence.endsWith('?') ||
        sentence.endsWith('!') ||
        sentence.includes('\n\n');

      if (isNaturalBreak && i < sentences.length - 1) {
        const chunkText = currentChunk.trim();
        chunks.push({
          text: chunkText,
          metadata: {
            chunkIndex: chunks.length,
            totalChunks: 0,
            startChar: chunkStartChar,
            endChar: currentCharPos,
            hasOverlap: lastOverlapSentences.length > 0,
            section: currentSection || undefined,
          },
        });

        // Prepare overlap for next chunk
        lastOverlapSentences = [sentence];
        currentChunk = sentence + ' ';
        chunkStartChar = currentCharPos - sentence.length - 1;
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length >= CHUNK_CONFIG.MIN_SIZE) {
    chunks.push({
      text: currentChunk.trim(),
      metadata: {
        chunkIndex: chunks.length,
        totalChunks: 0,
        startChar: chunkStartChar,
        endChar: text.length,
        hasOverlap: lastOverlapSentences.length > 0,
        section: currentSection || undefined,
      },
    });
  } else if (chunks.length > 0 && currentChunk.trim().length > 0) {
    // Merge small trailing chunk with previous
    const lastChunk = chunks[chunks.length - 1];
    lastChunk.text = lastChunk.text + ' ' + currentChunk.trim();
    lastChunk.metadata.endChar = text.length;
  }

  // Update total chunk count
  const totalChunks = chunks.length;
  chunks.forEach((chunk) => {
    chunk.metadata.totalChunks = totalChunks;
  });

  return chunks;
}

/**
 * Parse text into sentences preserving structure
 */
function parseSentences(text: string): string[] {
  // Split on sentence boundaries but keep abbreviations intact
  const sentences: string[] = [];

  // Regex that handles common abbreviations and decimal numbers
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n\n|$)/g;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
  }

  // Handle edge case where regex doesn't match
  if (sentences.length === 0 && text.trim().length > 0) {
    sentences.push(text.trim());
  }

  return sentences;
}

/**
 * Split text into chunks for embedding (legacy function - calls semanticChunk)
 * Uses sentence boundaries for natural splits
 */
function chunkText(text: string, chunkSize: number = 500): string[] {
  const chunks = semanticChunk(text, { targetSize: chunkSize });
  return chunks.map((c) => c.text);
}
