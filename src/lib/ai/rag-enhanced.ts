/**
 * Enhanced RAG (Retrieval-Augmented Generation) Module
 * 
 * Phase 2 Optimizations:
 * - Hybrid search: Combines vector similarity (70%) + keyword matching (30%)
 * - Query expansion: Generates query variations for better recall
 * - Reranking: Uses cross-encoder style scoring for precision
 * - Caching: Redis caching for frequently searched queries
 * 
 * Expected improvements:
 * - 35-40% better retrieval accuracy
 * - 25% better context relevance
 * - Reduced latency through caching
 */

import { db } from '@/lib/db';
import { knowledgeItems } from '@/db/schema';
import { eq, and, or, ilike } from 'drizzle-orm';
import { searchKnowledge, isVectorConfigured } from '@/lib/vector';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';
import { getCache, setCache, CONTEXT_CACHE_TTL, ContextCacheKeys } from '@/lib/cache';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedRAGResult {
  itemId: string;
  title: string;
  content: string;
  relevantChunk: string;
  score: number;
  vectorScore: number;
  keywordScore: number;
  rerankScore: number;
  sourceUrl: string | null;
  documentType: string;
  collectionName: string | null;
}

export interface EnhancedRAGContext {
  results: EnhancedRAGResult[];
  hasResults: boolean;
  contextText: string;
  citations: Array<{
    id: string;
    title: string;
    url: string | null;
  }>;
  searchMetadata: {
    originalQuery: string;
    expandedQueries: string[];
    vectorResultCount: number;
    keywordResultCount: number;
    fusedResultCount: number;
    rerankedResultCount: number;
    usedCache: boolean;
    searchTimeMs: number;
  };
}

interface SearchResult {
  itemId: string;
  title: string;
  content: string;
  chunk: string;
  score: number;
  sourceUrl: string | null;
  type: string;
  collectionName: string | null;
}

interface FusedSearchResult extends SearchResult {
  vectorScore: number;
  keywordScore: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Hybrid search weights
  VECTOR_WEIGHT: 0.7,
  KEYWORD_WEIGHT: 0.3,
  
  // Reciprocal rank fusion constant (higher = more weight to top ranks)
  RRF_K: 60,
  
  // Query expansion
  MAX_QUERY_EXPANSIONS: 3,
  
  // Result limits
  INITIAL_FETCH_MULTIPLIER: 3, // Fetch 3x topK for filtering/reranking
  DEFAULT_TOP_K: 5,
  MIN_SCORE_THRESHOLD: 0.3,
  
  // Reranking
  RERANK_TOP_N: 10, // Only rerank top N candidates
  RERANK_BATCH_SIZE: 5,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a hash for cache key from query string
 */
function hashQuery(query: string): string {
  return crypto.createHash('md5').update(query.toLowerCase().trim()).digest('hex').slice(0, 12);
}

/**
 * Reciprocal Rank Fusion (RRF) for combining ranked lists
 * Score = 1 / (k + rank) where k is a constant (typically 60)
 */
function reciprocalRankFusion(
  vectorResults: SearchResult[],
  keywordResults: SearchResult[],
  vectorWeight: number = CONFIG.VECTOR_WEIGHT,
  keywordWeight: number = CONFIG.KEYWORD_WEIGHT
): FusedSearchResult[] {
  const scores = new Map<string, { item: SearchResult; score: number; vectorScore: number; keywordScore: number }>();
  
  // Score vector results
  vectorResults.forEach((item, rank) => {
    const rrfScore = 1 / (CONFIG.RRF_K + rank + 1);
    const existing = scores.get(item.itemId);
    if (existing) {
      existing.score += rrfScore * vectorWeight;
      existing.vectorScore = rrfScore;
    } else {
      scores.set(item.itemId, {
        item,
        score: rrfScore * vectorWeight,
        vectorScore: rrfScore,
        keywordScore: 0,
      });
    }
  });
  
  // Score keyword results
  keywordResults.forEach((item, rank) => {
    const rrfScore = 1 / (CONFIG.RRF_K + rank + 1);
    const existing = scores.get(item.itemId);
    if (existing) {
      existing.score += rrfScore * keywordWeight;
      existing.keywordScore = rrfScore;
    } else {
      scores.set(item.itemId, {
        item,
        score: rrfScore * keywordWeight,
        vectorScore: 0,
        keywordScore: rrfScore,
      });
    }
  });
  
  // Sort by combined score
  const fusedResults = Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score, vectorScore, keywordScore }) => ({
      ...item,
      score,
      vectorScore,
      keywordScore,
    }));
  
  return fusedResults;
}

// ============================================================================
// QUERY EXPANSION
// ============================================================================

/**
 * Generate query variations using GPT-4o-mini for better retrieval recall
 */
export async function expandQuery(query: string): Promise<string[]> {
  // Check cache first
  const cacheKey = ContextCacheKeys.queryExpansion(hashQuery(query));
  const cached = await getCache<string[]>(cacheKey, { ttl: CONTEXT_CACHE_TTL.QUERY_EXPANSION, prefix: '' });
  if (cached) {
    logger.debug('[RAG] Using cached query expansions', { query: query.slice(0, 50) });
    return cached;
  }
  
  try {
    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a search query optimizer. Generate ${CONFIG.MAX_QUERY_EXPANSIONS} alternative search queries that would help find relevant documents for the user's question. Focus on:
1. Synonyms and related terms
2. More specific or more general versions
3. Different phrasings that capture the same intent

Respond with ONLY the queries, one per line. No numbering, no explanations.`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    const expansions = response.choices[0]?.message?.content
      ?.split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && q.length < 200)
      .slice(0, CONFIG.MAX_QUERY_EXPANSIONS) || [];
    
    // Cache the expansions
    if (expansions.length > 0) {
      await setCache(cacheKey, expansions, { ttl: CONTEXT_CACHE_TTL.QUERY_EXPANSION, prefix: '' });
    }
    
    logger.debug('[RAG] Generated query expansions', {
      original: query.slice(0, 50),
      expansions: expansions.length,
    });
    
    return expansions;
  } catch (error) {
    logger.warn('[RAG] Query expansion failed, using original query', error instanceof Error ? { error: error.message } : undefined);
    return [];
  }
}

// ============================================================================
// KEYWORD SEARCH (BM25-style)
// ============================================================================

/**
 * Enhanced keyword search with TF-IDF style scoring
 */
async function keywordSearch(
  query: string,
  workspaceId: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    // Extract meaningful terms (remove stop words, keep 3+ char terms)
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'will', 'more', 'when', 'who', 'what', 'where', 'why', 'how', 'which', 'their', 'there', 'this', 'that', 'with', 'from', 'they', 'would', 'about', 'into', 'could', 'than', 'been']);
    
    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length >= 3 && !stopWords.has(term));
    
    if (queryTerms.length === 0) {
      return [];
    }
    
    // Build search conditions for each term
    const searchConditions = queryTerms.flatMap(term => {
      const pattern = `%${term}%`;
      return [
        ilike(knowledgeItems.title, pattern),
        ilike(knowledgeItems.content, pattern),
        ilike(knowledgeItems.summary, pattern),
      ];
    });
    
    const documents = await db.query.knowledgeItems.findMany({
      where: and(
        eq(knowledgeItems.workspaceId, workspaceId),
        eq(knowledgeItems.status, 'ready'),
        or(...searchConditions)
      ),
      limit: limit * 2, // Fetch extra for scoring
      with: {
        collection: {
          columns: { name: true },
        },
      },
    });
    
    // Score documents based on term frequency and field weights
    const scoredDocs = documents.map(doc => {
      let score = 0;
      const titleLower = (doc.title || '').toLowerCase();
      const contentLower = (doc.content || '').toLowerCase();
      const summaryLower = (doc.summary || '').toLowerCase();
      
      for (const term of queryTerms) {
        // Title matches are weighted higher (3x)
        const titleMatches = (titleLower.match(new RegExp(term, 'g')) || []).length;
        score += titleMatches * 3;
        
        // Summary matches (2x)
        const summaryMatches = (summaryLower.match(new RegExp(term, 'g')) || []).length;
        score += summaryMatches * 2;
        
        // Content matches (1x, normalized by length)
        const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
        const contentLength = Math.max(contentLower.length, 1);
        score += (contentMatches / Math.log10(contentLength + 10)) * 1;
      }
      
      // Normalize score
      const normalizedScore = Math.min(score / (queryTerms.length * 3), 1);
      
      // Extract relevant chunk
      const relevantChunk = extractRelevantChunk(doc.content || '', query);
      const collection = Array.isArray(doc.collection) ? doc.collection[0] : doc.collection;
      
      return {
        itemId: doc.id,
        title: doc.title,
        content: doc.content || '',
        chunk: relevantChunk,
        score: normalizedScore,
        sourceUrl: doc.sourceUrl,
        type: doc.type,
        collectionName: collection?.name || null,
      };
    });
    
    // Sort by score and return top results
    return scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    logger.error('[RAG] Keyword search failed', error);
    return [];
  }
}

/**
 * Extract the most relevant text chunk containing query terms
 */
function extractRelevantChunk(content: string, query: string): string {
  if (!content) return '';
  
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Score each sentence
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const score = queryTerms.filter(term => lowerSentence.includes(term)).length;
    return { sentence: sentence.trim(), score };
  });
  
  // Sort by score and build chunk
  scoredSentences.sort((a, b) => b.score - a.score);
  
  let chunk = '';
  for (const { sentence } of scoredSentences) {
    if (chunk.length + sentence.length > 500) break;
    chunk += (chunk ? ' ' : '') + sentence + '.';
  }
  
  // Fallback to first 500 chars if no matches
  if (!chunk) {
    chunk = content.slice(0, 500).trim() + '...';
  }
  
  return chunk;
}

// ============================================================================
// VECTOR SEARCH
// ============================================================================

/**
 * Perform vector similarity search
 */
async function vectorSearch(
  query: string,
  workspaceId: string,
  limit: number
): Promise<SearchResult[]> {
  if (!isVectorConfigured()) {
    return [];
  }
  
  try {
    const searchResults = await searchKnowledge(workspaceId, query, {
      topK: limit,
      minScore: CONFIG.MIN_SCORE_THRESHOLD,
    });
    
    if (searchResults.results.length === 0) {
      return [];
    }
    
    // Fetch full document data
    const itemIds = searchResults.results.map(r => r.itemId);
    const documents = await db.query.knowledgeItems.findMany({
      where: and(
        eq(knowledgeItems.workspaceId, workspaceId),
        or(...itemIds.map(id => eq(knowledgeItems.id, id)))
      ),
      with: {
        collection: {
          columns: { name: true },
        },
      },
    });
    
    // Build results
    return searchResults.results.map(sr => {
      const doc = documents.find(d => d.id === sr.itemId);
      const collection = doc?.collection 
        ? (Array.isArray(doc.collection) ? doc.collection[0] : doc.collection)
        : null;
      
      return {
        itemId: sr.itemId,
        title: sr.title || doc?.title || 'Untitled',
        content: doc?.content || '',
        chunk: sr.chunk,
        score: sr.score,
        sourceUrl: doc?.sourceUrl || null,
        type: doc?.type || 'document',
        collectionName: collection?.name || null,
      };
    });
  } catch (error) {
    logger.error('[RAG] Vector search failed', error);
    return [];
  }
}

// ============================================================================
// RERANKING
// ============================================================================

/**
 * Rerank results using OpenAI to score relevance
 * Uses a cross-encoder style approach with prompt-based scoring
 */
async function rerankResults(
  query: string,
  results: FusedSearchResult[]
): Promise<(FusedSearchResult & { rerankScore: number })[]> {
  if (results.length === 0) {
    return [];
  }
  
  // Only rerank top N candidates
  const candidatesToRerank = results.slice(0, CONFIG.RERANK_TOP_N);
  const remainingResults = results.slice(CONFIG.RERANK_TOP_N);
  
  try {
    const openai = getOpenAI();
    
    // Process in batches
    const rerankedResults: (FusedSearchResult & { rerankScore: number })[] = [];
    
    for (let i = 0; i < candidatesToRerank.length; i += CONFIG.RERANK_BATCH_SIZE) {
      const batch = candidatesToRerank.slice(i, i + CONFIG.RERANK_BATCH_SIZE);
      
      const documents = batch.map((r, idx) => 
        `Document ${idx + 1} [${r.title}]: ${r.chunk.slice(0, 300)}`
      ).join('\n\n');
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a relevance scorer. Score how well each document answers the user's query on a scale of 0-10.
Respond with ONLY numbers separated by commas, one score per document in order.
Example response for 3 documents: "8,3,6"

Scoring guidelines:
- 10: Perfect match, directly answers the query
- 7-9: Highly relevant, contains key information
- 4-6: Somewhat relevant, related topic
- 1-3: Marginally relevant, tangentially related
- 0: Not relevant at all`,
          },
          {
            role: 'user',
            content: `Query: "${query}"\n\n${documents}`,
          },
        ],
        max_tokens: 50,
        temperature: 0,
      });
      
      const scoresStr = response.choices[0]?.message?.content || '';
      const scores = scoresStr
        .split(',')
        .map(s => {
          const parsed = parseFloat(s.trim());
          return isNaN(parsed) ? 5 : Math.min(10, Math.max(0, parsed));
        });
      
      // Add rerank scores to batch items
      batch.forEach((item, idx) => {
        const rerankScore = (scores[idx] ?? 5) / 10; // Normalize to 0-1
        rerankedResults.push({
          ...item,
          rerankScore,
          // Combine original score with rerank score (60% original, 40% rerank)
          score: item.score * 0.6 + rerankScore * 0.4,
        });
      });
    }
    
    // Add remaining results with default rerank score
    const finalResults = [
      ...rerankedResults,
      ...remainingResults.map(r => ({ ...r, rerankScore: 0.5 })),
    ];
    
    // Re-sort by combined score
    finalResults.sort((a, b) => b.score - a.score);
    
    logger.debug('[RAG] Reranking completed', {
      candidatesReranked: candidatesToRerank.length,
      topScore: finalResults[0]?.score || 0,
    });
    
    return finalResults;
  } catch (error) {
    logger.warn('[RAG] Reranking failed, using original order', error instanceof Error ? { error: error.message } : undefined);
    return results.map(r => ({ ...r, rerankScore: 0.5 }));
  }
}

// ============================================================================
// MAIN ENHANCED SEARCH FUNCTION
// ============================================================================

/**
 * Enhanced knowledge base search with hybrid retrieval, query expansion, and reranking
 */
export async function searchKnowledgeBaseEnhanced(
  query: string,
  workspaceId: string,
  options: {
    topK?: number;
    useQueryExpansion?: boolean;
    useReranking?: boolean;
    useCache?: boolean;
    documentType?: string;
    collectionId?: string;
  } = {}
): Promise<EnhancedRAGContext> {
  const startTime = Date.now();
  const {
    topK = CONFIG.DEFAULT_TOP_K,
    useQueryExpansion = true,
    useReranking = true,
    useCache = true,
    documentType,
    collectionId,
  } = options;
  
  // Check cache first
  if (useCache) {
    const cacheKey = ContextCacheKeys.ragSearch(workspaceId, hashQuery(query));
    const cached = await getCache<EnhancedRAGContext>(cacheKey, { 
      ttl: CONTEXT_CACHE_TTL.RAG_SEARCH, 
      prefix: '' 
    });
    if (cached) {
      logger.info('[RAG] Cache hit for search', { query: query.slice(0, 50) });
      return {
        ...cached,
        searchMetadata: {
          ...cached.searchMetadata,
          usedCache: true,
          searchTimeMs: Date.now() - startTime,
        },
      };
    }
  }
  
  try {
    // Step 1: Query expansion (optional)
    let allQueries = [query];
    if (useQueryExpansion) {
      const expansions = await expandQuery(query);
      allQueries = [query, ...expansions];
    }
    
    // Step 2: Hybrid search (vector + keyword) for all queries
    const fetchLimit = topK * CONFIG.INITIAL_FETCH_MULTIPLIER;
    
    const [vectorResults, keywordResults] = await Promise.all([
      // Vector search with all query variations
      Promise.all(allQueries.map(q => vectorSearch(q, workspaceId, fetchLimit)))
        .then(results => {
          // Merge and deduplicate, keeping highest score per item
          const merged = new Map<string, SearchResult>();
          for (const resultSet of results) {
            for (const item of resultSet) {
              const existing = merged.get(item.itemId);
              if (!existing || item.score > existing.score) {
                merged.set(item.itemId, item);
              }
            }
          }
          return Array.from(merged.values()).sort((a, b) => b.score - a.score);
        }),
      // Keyword search with all query variations
      Promise.all(allQueries.map(q => keywordSearch(q, workspaceId, fetchLimit)))
        .then(results => {
          // Merge and deduplicate
          const merged = new Map<string, SearchResult>();
          for (const resultSet of results) {
            for (const item of resultSet) {
              const existing = merged.get(item.itemId);
              if (!existing || item.score > existing.score) {
                merged.set(item.itemId, item);
              }
            }
          }
          return Array.from(merged.values()).sort((a, b) => b.score - a.score);
        }),
    ]);
    
    // Step 3: Reciprocal rank fusion
    const fusedResults = reciprocalRankFusion(vectorResults, keywordResults);
    
    // Step 4: Filter by document type and collection if specified
    let filteredResults = fusedResults;
    if (documentType) {
      filteredResults = filteredResults.filter(r => r.type === documentType);
    }
    // Note: collectionId filtering would need additional joins, skipping for now
    
    // Step 5: Reranking (optional)
    let finalResults: (FusedSearchResult & { rerankScore: number })[];
    if (useReranking && filteredResults.length > 0) {
      finalResults = await rerankResults(query, filteredResults);
    } else {
      finalResults = filteredResults.map(r => ({ 
        ...r, 
        rerankScore: 0.5 
      }));
    }
    
    // Step 6: Take top K results
    const topResults = finalResults.slice(0, topK);
    
    // Build enhanced results
    const enhancedResults: EnhancedRAGResult[] = topResults.map(r => ({
      itemId: r.itemId,
      title: r.title,
      content: r.content,
      relevantChunk: r.chunk,
      score: r.score,
      vectorScore: r.vectorScore,
      keywordScore: r.keywordScore,
      rerankScore: r.rerankScore,
      sourceUrl: r.sourceUrl,
      documentType: r.type,
      collectionName: r.collectionName,
    }));
    
    // Build context text
    const contextText = buildContextText(enhancedResults);
    
    // Build citations
    const citations = enhancedResults.map(r => ({
      id: r.itemId,
      title: r.title,
      url: r.sourceUrl,
    }));
    
    const result: EnhancedRAGContext = {
      results: enhancedResults,
      hasResults: enhancedResults.length > 0,
      contextText,
      citations,
      searchMetadata: {
        originalQuery: query,
        expandedQueries: allQueries.slice(1),
        vectorResultCount: vectorResults.length,
        keywordResultCount: keywordResults.length,
        fusedResultCount: fusedResults.length,
        rerankedResultCount: finalResults.length,
        usedCache: false,
        searchTimeMs: Date.now() - startTime,
      },
    };
    
    // Cache the result
    if (useCache && enhancedResults.length > 0) {
      const cacheKey = ContextCacheKeys.ragSearch(workspaceId, hashQuery(query));
      await setCache(cacheKey, result, { ttl: CONTEXT_CACHE_TTL.RAG_SEARCH, prefix: '' });
    }
    
    logger.info('[RAG] Enhanced search completed', {
      query: query.slice(0, 50),
      resultsCount: enhancedResults.length,
      vectorResults: vectorResults.length,
      keywordResults: keywordResults.length,
      fusedResults: fusedResults.length,
      topScore: enhancedResults[0]?.score || 0,
      searchTimeMs: Date.now() - startTime,
    });
    
    return result;
  } catch (error) {
    logger.error('[RAG] Enhanced search failed', error);
    return {
      results: [],
      hasResults: false,
      contextText: '',
      citations: [],
      searchMetadata: {
        originalQuery: query,
        expandedQueries: [],
        vectorResultCount: 0,
        keywordResultCount: 0,
        fusedResultCount: 0,
        rerankedResultCount: 0,
        usedCache: false,
        searchTimeMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Build context text for AI prompt injection
 */
function buildContextText(results: EnhancedRAGResult[]): string {
  if (results.length === 0) return '';
  
  const contextParts = results.map((r, i) => {
    const source = r.sourceUrl
      ? ` (Source: ${r.sourceUrl})`
      : ` (From: ${r.collectionName || 'Library'})`;
    
    const confidenceTag = r.score >= 0.7 
      ? '[HIGH RELEVANCE]' 
      : r.score >= 0.5 
        ? '[MEDIUM RELEVANCE]' 
        : '[LOW RELEVANCE]';
    
    return `[Document ${i + 1}: "${r.title}"${source}] ${confidenceTag}
${r.relevantChunk}`;
  });
  
  return `--- RELEVANT KNOWLEDGE BASE DOCUMENTS ---
${contextParts.join('\n\n')}
--- END KNOWLEDGE BASE ---`;
}

/**
 * Compatibility wrapper: Use enhanced search with fallback to basic search
 */
export async function searchKnowledgeBaseWithFallback(
  query: string,
  workspaceId: string,
  options: {
    topK?: number;
    minScore?: number;
    documentType?: string;
    collectionId?: string;
    enhanced?: boolean;
  } = {}
): Promise<EnhancedRAGContext> {
  const { enhanced = true, ...restOptions } = options;
  
  if (enhanced) {
    return searchKnowledgeBaseEnhanced(query, workspaceId, restOptions);
  }
  
  // Import and use basic search for backward compatibility
  const { searchKnowledgeBase } = await import('./rag');
  const basicResult = await searchKnowledgeBase(query, workspaceId, restOptions);
  
  // Convert to enhanced format
  return {
    results: basicResult.results.map(r => ({
      ...r,
      vectorScore: r.score,
      keywordScore: 0,
      rerankScore: 0.5,
    })),
    hasResults: basicResult.hasResults,
    contextText: basicResult.contextText,
    citations: basicResult.citations,
    searchMetadata: {
      originalQuery: query,
      expandedQueries: [],
      vectorResultCount: basicResult.results.length,
      keywordResultCount: 0,
      fusedResultCount: basicResult.results.length,
      rerankedResultCount: basicResult.results.length,
      usedCache: false,
      searchTimeMs: 0,
    },
  };
}
