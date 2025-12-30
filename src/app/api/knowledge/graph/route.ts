import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeCollections } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { expensiveOperationLimit } from '@/lib/rate-limit';

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
  id: string;
  type: 'document' | 'collection' | 'topic' | 'entity';
  label: string;
  size: number;
  color: string;
  metadata?: {
    itemType?: string;
    createdAt?: Date;
    summary?: string;
    wordCount?: number;
  };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'belongs_to' | 'related' | 'references' | 'shares_topic';
  weight: number;
  label?: string;
}

interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalDocuments: number;
    totalCollections: number;
    totalTopics: number;
    totalConnections: number;
  };
}

// ============================================================================
// TOPIC EXTRACTION
// ============================================================================

const COMMON_TOPICS = [
  'api', 'integration', 'workflow', 'automation', 'crm', 'sales', 'marketing',
  'analytics', 'data', 'report', 'dashboard', 'user', 'customer', 'product',
  'feature', 'documentation', 'guide', 'tutorial', 'setup', 'configuration',
  'security', 'authentication', 'billing', 'subscription', 'team', 'admin',
  'ai', 'agent', 'assistant', 'knowledge', 'search', 'email', 'notification',
];

function extractTopics(content: string, title: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const topics: string[] = [];

  for (const topic of COMMON_TOPICS) {
    if (text.includes(topic)) {
      topics.push(topic);
    }
  }

  // Extract capitalized words as potential entities (simplified NER)
  const capitalizedWords = (title + ' ' + (content || '').substring(0, 2000))
    .match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  
  const entities = [...new Set(capitalizedWords)]
    .filter(word => word.length > 3 && !['The', 'This', 'That', 'When', 'What', 'How', 'Why'].includes(word))
    .slice(0, 5);

  return [...new Set([...topics, ...entities.map(e => e.toLowerCase())])].slice(0, 10);
}

// ============================================================================
// GRAPH BUILDING
// ============================================================================

function buildKnowledgeGraph(
  items: Array<{
    id: string;
    title: string;
    content: string | null;
    type: string;
    collectionId: string | null;
    createdAt: Date;
    summary: string | null;
    tags: string[] | null;
  }>,
  collections: Array<{
    id: string;
    name: string;
    color: string | null;
    itemCount: number;
  }>
): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const topicMap = new Map<string, Set<string>>(); // topic -> document IDs

  // Create collection nodes
  for (const collection of collections) {
    nodes.push({
      id: `col_${collection.id}`,
      type: 'collection',
      label: collection.name,
      size: Math.min(20 + collection.itemCount * 2, 50),
      color: collection.color || '#6366f1',
      metadata: {
        wordCount: collection.itemCount,
      },
    });
  }

  // Create document nodes and extract topics
  for (const item of items) {
    const wordCount = (item.content || '').split(/\s+/).filter(Boolean).length;
    
    nodes.push({
      id: `doc_${item.id}`,
      type: 'document',
      label: item.title.length > 40 ? item.title.substring(0, 37) + '...' : item.title,
      size: Math.min(10 + Math.sqrt(wordCount) * 0.5, 30),
      color: getDocumentColor(item.type),
      metadata: {
        itemType: item.type,
        createdAt: item.createdAt,
        summary: item.summary || undefined,
        wordCount,
      },
    });

    // Create edge to collection
    if (item.collectionId) {
      edges.push({
        id: `edge_${item.id}_col`,
        source: `doc_${item.id}`,
        target: `col_${item.collectionId}`,
        type: 'belongs_to',
        weight: 1,
      });
    }

    // Extract and track topics
    const topics = extractTopics(item.content || '', item.title);
    for (const topic of topics) {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, new Set());
      }
      topicMap.get(topic)!.add(item.id);
    }
  }

  // Create topic nodes and edges for topics shared by multiple documents
  const significantTopics = Array.from(topicMap.entries())
    .filter(([_, docs]) => docs.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 15);

  for (const [topic, docIds] of significantTopics) {
    const topicNodeId = `topic_${topic}`;
    
    nodes.push({
      id: topicNodeId,
      type: 'topic',
      label: topic,
      size: 8 + docIds.size * 3,
      color: '#10b981',
    });

    // Connect documents to topic
    for (const docId of docIds) {
      edges.push({
        id: `edge_${docId}_${topic}`,
        source: `doc_${docId}`,
        target: topicNodeId,
        type: 'shares_topic',
        weight: 0.5,
        label: topic,
      });
    }
  }

  // Create document-to-document edges for documents sharing multiple topics
  const docPairScores = new Map<string, number>();
  
  for (const [_, docIds] of significantTopics) {
    const docs = Array.from(docIds);
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const pairKey = [docs[i], docs[j]].sort().join('_');
        docPairScores.set(pairKey, (docPairScores.get(pairKey) || 0) + 1);
      }
    }
  }

  // Add edges for strongly related documents (sharing 3+ topics)
  for (const [pairKey, score] of docPairScores.entries()) {
    if (score >= 3) {
      const [docA, docB] = pairKey.split('_');
      edges.push({
        id: `edge_rel_${pairKey}`,
        source: `doc_${docA}`,
        target: `doc_${docB}`,
        type: 'related',
        weight: score * 0.3,
        label: `${score} shared topics`,
      });
    }
  }

  return {
    nodes,
    edges,
    stats: {
      totalDocuments: items.length,
      totalCollections: collections.length,
      totalTopics: significantTopics.length,
      totalConnections: edges.length,
    },
  };
}

function getDocumentColor(type: string): string {
  const colors: Record<string, string> = {
    document: '#3b82f6',
    pdf: '#ef4444',
    image: '#ec4899',
    note: '#f59e0b',
    url: '#06b6d4',
    video: '#8b5cf6',
  };
  return colors[type.toLowerCase()] || '#6b7280';
}

// ============================================================================
// GET - Fetch knowledge graph data
// ============================================================================

export async function GET(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limit - expensive operation (10 requests per minute)
    const rateLimitResult = await expensiveOperationLimit(`knowledge-graph:${userId}`);
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

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    // Fetch collections
    const collections = await db.query.knowledgeCollections.findMany({
      where: eq(knowledgeCollections.workspaceId, workspaceId),
    });

    // Fetch items
    const whereClause = collectionId
      ? [eq(knowledgeItems.workspaceId, workspaceId), eq(knowledgeItems.collectionId, collectionId)]
      : [eq(knowledgeItems.workspaceId, workspaceId)];

    const items = await db.query.knowledgeItems.findMany({
      where: whereClause.length > 1 
        ? (table, { and }) => and(eq(knowledgeItems.workspaceId, workspaceId), eq(knowledgeItems.collectionId, collectionId!))
        : eq(knowledgeItems.workspaceId, workspaceId),
      orderBy: [desc(knowledgeItems.createdAt)],
      limit,
      columns: {
        id: true,
        title: true,
        content: true,
        type: true,
        collectionId: true,
        createdAt: true,
        summary: true,
        tags: true,
      },
    });

    // Build the graph
    const graph = buildKnowledgeGraph(items, collections);

    logger.info('[Knowledge Graph] Generated graph', {
      workspaceId,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
    });

    return NextResponse.json(graph);
  } catch (error) {
    logger.error('[Knowledge Graph] Error generating graph', error);
    return NextResponse.json(
      { error: 'Failed to generate knowledge graph' },
      { status: 500 }
    );
  }
}
