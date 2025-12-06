/**
 * RAG (Retrieval-Augmented Generation) Module
 * 
 * This module enables Neptune to search the user's knowledge base
 * and provide grounded answers with citations.
 */

import { db } from '@/lib/db';
import { knowledgeItems } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { searchKnowledge, isVectorConfigured } from '@/lib/vector';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface RAGSearchResult {
  itemId: string;
  title: string;
  content: string;
  relevantChunk: string;
  score: number;
  sourceUrl: string | null;
  documentType: string;
  collectionName: string | null;
}

export interface RAGContext {
  results: RAGSearchResult[];
  hasResults: boolean;
  contextText: string;
  citations: Array<{
    id: string;
    title: string;
    url: string | null;
  }>;
}

// ============================================================================
// MAIN RAG FUNCTIONS
// ============================================================================

/**
 * Search the knowledge base for relevant documents
 * Returns results with full context for AI to use
 * 
 * @param query - The user's question or search query
 * @param workspaceId - The workspace to search in
 * @param options - Search options
 */
export async function searchKnowledgeBase(
  query: string,
  workspaceId: string,
  options: {
    topK?: number;
    minScore?: number;
    documentType?: string;
    collectionId?: string;
  } = {}
): Promise<RAGContext> {
  const { topK = 5, minScore = 0.5, documentType, collectionId } = options;

  try {
    // Check if vector search is available
    if (!isVectorConfigured()) {
      logger.warn('[RAG] Vector search not configured, using keyword fallback');
      return keywordFallbackSearch(query, workspaceId, topK);
    }

    // Perform semantic search
    const searchResults = await searchKnowledge(workspaceId, query, {
      topK: topK * 2, // Get extra for filtering
      minScore,
      type: documentType,
    });

    if (searchResults.results.length === 0) {
      logger.info('[RAG] No semantic results, trying keyword fallback');
      return keywordFallbackSearch(query, workspaceId, topK);
    }

    // Fetch full document data for results
    const itemIds = searchResults.results.map(r => r.itemId);
    const documents = await db.query.knowledgeItems.findMany({
      where: and(
        eq(knowledgeItems.workspaceId, workspaceId),
        or(...itemIds.map(id => eq(knowledgeItems.id, id)))
      ),
      with: {
        collection: {
          columns: {
            name: true,
          },
        },
      },
    });

    // Build results with full context
    const results: RAGSearchResult[] = [];
    for (const sr of searchResults.results) {
      const doc = documents.find(d => d.id === sr.itemId);
      if (!doc) continue;

      // Normalize collection which may be array or object
      const collection = Array.isArray(doc.collection) ? doc.collection[0] : doc.collection;

      results.push({
        itemId: doc.id,
        title: doc.title,
        content: doc.content || '',
        relevantChunk: sr.chunk,
        score: sr.score,
        sourceUrl: doc.sourceUrl,
        documentType: doc.type,
        collectionName: collection?.name || null,
      });

      if (results.length >= topK) break;
    }

    // Filter by collectionId if specified
    let filteredResults = results;
    if (collectionId) {
      filteredResults = results.filter(r => {
        const doc = documents.find(d => d.id === r.itemId);
        return doc?.collectionId === collectionId;
      });
    }

    // Build context text for injection into AI prompt
    const contextText = buildContextText(filteredResults);

    // Build citations
    const citations = filteredResults.map(r => ({
      id: r.itemId,
      title: r.title,
      url: r.sourceUrl,
    }));

    logger.info('[RAG] Search completed', {
      query: query.slice(0, 50),
      resultsCount: filteredResults.length,
      topScore: filteredResults[0]?.score || 0,
    });

    return {
      results: filteredResults,
      hasResults: filteredResults.length > 0,
      contextText,
      citations,
    };
  } catch (error) {
    logger.error('[RAG] Search failed', error);
    return {
      results: [],
      hasResults: false,
      contextText: '',
      citations: [],
    };
  }
}

/**
 * Keyword fallback search when vector search is unavailable
 */
async function keywordFallbackSearch(
  query: string,
  workspaceId: string,
  limit: number
): Promise<RAGContext> {
  try {
    const { like } = await import('drizzle-orm');
    
    const searchPattern = `%${query}%`;
    const documents = await db.query.knowledgeItems.findMany({
      where: and(
        eq(knowledgeItems.workspaceId, workspaceId),
        or(
          like(knowledgeItems.title, searchPattern),
          like(knowledgeItems.content, searchPattern),
          like(knowledgeItems.summary, searchPattern)
        )
      ),
      limit,
      with: {
        collection: {
          columns: {
            name: true,
          },
        },
      },
    });

    const results: RAGSearchResult[] = documents.map(doc => {
      // Normalize collection which may be array or object
      const collection = Array.isArray(doc.collection) ? doc.collection[0] : doc.collection;
      
      // Extract relevant chunk from content
      const relevantChunk = extractRelevantChunk(doc.content || '', query);

      return {
        itemId: doc.id,
        title: doc.title,
        content: doc.content || '',
        relevantChunk,
        score: 0.5, // Default score for keyword matches
        sourceUrl: doc.sourceUrl,
        documentType: doc.type,
        collectionName: collection?.name || null,
      };
    });

    const contextText = buildContextText(results);
    const citations = results.map(r => ({
      id: r.itemId,
      title: r.title,
      url: r.sourceUrl,
    }));

    return {
      results,
      hasResults: results.length > 0,
      contextText,
      citations,
    };
  } catch (error) {
    logger.error('[RAG] Keyword fallback search failed', error);
    return {
      results: [],
      hasResults: false,
      contextText: '',
      citations: [],
    };
  }
}

/**
 * Extract the most relevant chunk from content based on query
 */
function extractRelevantChunk(content: string, query: string): string {
  if (!content) return '';

  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Score each sentence by how many query terms it contains
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const score = queryTerms.filter(term => lowerSentence.includes(term)).length;
    return { sentence: sentence.trim(), score };
  });

  // Sort by score and take top sentences up to ~500 chars
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

/**
 * Build context text for injection into AI prompt
 */
function buildContextText(results: RAGSearchResult[]): string {
  if (results.length === 0) return '';

  const contextParts = results.map((r, i) => {
    const source = r.sourceUrl 
      ? ` (Source: ${r.sourceUrl})`
      : ` (From: ${r.collectionName || 'Library'})`;
    
    return `[Document ${i + 1}: "${r.title}"${source}]
${r.relevantChunk}`;
  });

  return `--- RELEVANT KNOWLEDGE BASE DOCUMENTS ---
${contextParts.join('\n\n')}
--- END KNOWLEDGE BASE ---`;
}

/**
 * Check if a query might benefit from RAG
 * Returns true for questions or queries that seem to be looking for information
 */
export function shouldUseRAG(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Question indicators
  const questionIndicators = [
    'what', 'when', 'where', 'who', 'why', 'how',
    'explain', 'describe', 'tell me', 'show me',
    'find', 'search', 'look up', 'look for',
    'according to', 'based on', 'in my documents',
    'in my files', 'in my knowledge', 'from my',
    '?'
  ];

  // Check if message contains question indicators
  const hasQuestionIndicator = questionIndicators.some(
    indicator => lowerMessage.includes(indicator)
  );

  // Don't use RAG for simple commands or actions
  const actionIndicators = [
    'create', 'add', 'make', 'schedule', 'send',
    'delete', 'remove', 'update', 'change', 'set'
  ];

  const isActionCommand = actionIndicators.some(
    indicator => lowerMessage.startsWith(indicator)
  );

  return hasQuestionIndicator && !isActionCommand;
}

/**
 * Format RAG results as citations for the AI response
 */
export function formatCitations(citations: RAGContext['citations']): string {
  if (citations.length === 0) return '';

  return citations
    .map((c, i) => `[${i + 1}] ${c.title}${c.url ? ` - ${c.url}` : ''}`)
    .join('\n');
}
