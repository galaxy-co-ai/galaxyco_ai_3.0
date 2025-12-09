/**
 * Global Search API
 * 
 * Searches across all workspace data: contacts, campaigns, knowledge items,
 * creator items, agents, and blog posts.
 * 
 * GET /api/search?q=query&types=contacts,campaigns&limit=20
 * 
 * Query params:
 * - q: Search query (required, min 2 chars)
 * - types: Comma-separated list of types to search (optional, defaults to all)
 * - limit: Max results per category (optional, default 5, max 20)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { 
  contacts, 
  campaigns, 
  knowledgeItems, 
  creatorItems, 
  agents, 
  blogPosts 
} from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { and, eq, ilike, or, sql, desc } from 'drizzle-orm';
import { withRateLimit } from '@/lib/rate-limit';

// Validation schema
const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  types: z.string().optional(),
  limit: z.coerce.number().min(1).max(20).default(5),
});

// Types for search results
export interface SearchResult {
  id: string;
  type: 'contact' | 'campaign' | 'knowledge' | 'creator' | 'agent' | 'blog';
  title: string;
  description: string | null;
  url: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  categories: {
    contacts: SearchResult[];
    campaigns: SearchResult[];
    knowledge: SearchResult[];
    creator: SearchResult[];
    agents: SearchResult[];
    blog: SearchResult[];
  };
  totalCount: number;
}

/**
 * GET /api/search
 * 
 * Search across workspace data with multi-tenant filtering
 */
async function searchHandler(request: NextRequest) {
  try {
    // Auth check
    const { workspaceId } = await getCurrentWorkspace();
    
    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams;
    const rawQuery = searchParams.get('q') || '';
    const rawTypes = searchParams.get('types') || '';
    const rawLimit = searchParams.get('limit') || '5';
    
    const validation = searchQuerySchema.safeParse({
      q: rawQuery,
      types: rawTypes,
      limit: rawLimit,
    });
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { q: query, types: typesString, limit } = validation.data;
    
    // Parse requested types
    const allTypes = ['contacts', 'campaigns', 'knowledge', 'creator', 'agents', 'blog'];
    const requestedTypes = typesString 
      ? typesString.split(',').filter(t => allTypes.includes(t))
      : allTypes;
    
    // Build ILIKE pattern for Postgres
    const searchPattern = `%${query}%`;
    
    // Initialize results
    const categories: SearchResponse['categories'] = {
      contacts: [],
      campaigns: [],
      knowledge: [],
      creator: [],
      agents: [],
      blog: [],
    };
    
    // Search contacts
    if (requestedTypes.includes('contacts')) {
      const contactResults = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          company: contacts.company,
          title: contacts.title,
        })
        .from(contacts)
        .where(
          and(
            eq(contacts.workspaceId, workspaceId),
            or(
              ilike(contacts.firstName, searchPattern),
              ilike(contacts.lastName, searchPattern),
              ilike(contacts.email, searchPattern),
              ilike(contacts.company, searchPattern),
              ilike(sql`COALESCE(${contacts.firstName}, '') || ' ' || COALESCE(${contacts.lastName}, '')`, searchPattern)
            )
          )
        )
        .limit(limit)
        .orderBy(desc(contacts.updatedAt));
      
      categories.contacts = contactResults.map(c => ({
        id: c.id,
        type: 'contact' as const,
        title: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
        description: c.company ? `${c.title || ''} at ${c.company}`.trim() : c.email,
        url: `/crm/contacts/${c.id}`,
        icon: 'user',
        metadata: { email: c.email, company: c.company },
      }));
    }
    
    // Search campaigns
    if (requestedTypes.includes('campaigns')) {
      const campaignResults = await db
        .select({
          id: campaigns.id,
          name: campaigns.name,
          description: campaigns.description,
          status: campaigns.status,
          type: campaigns.type,
        })
        .from(campaigns)
        .where(
          and(
            eq(campaigns.workspaceId, workspaceId),
            or(
              ilike(campaigns.name, searchPattern),
              ilike(campaigns.description, searchPattern)
            )
          )
        )
        .limit(limit)
        .orderBy(desc(campaigns.updatedAt));
      
      categories.campaigns = campaignResults.map(c => ({
        id: c.id,
        type: 'campaign' as const,
        title: c.name,
        description: c.description || `${c.type} campaign - ${c.status}`,
        url: `/marketing/campaigns/${c.id}`,
        icon: 'megaphone',
        metadata: { status: c.status, campaignType: c.type },
      }));
    }
    
    // Search knowledge items
    if (requestedTypes.includes('knowledge')) {
      const knowledgeResults = await db
        .select({
          id: knowledgeItems.id,
          title: knowledgeItems.title,
          type: knowledgeItems.type,
          status: knowledgeItems.status,
          summary: knowledgeItems.summary,
        })
        .from(knowledgeItems)
        .where(
          and(
            eq(knowledgeItems.workspaceId, workspaceId),
            eq(knowledgeItems.status, 'ready'),
            or(
              ilike(knowledgeItems.title, searchPattern),
              ilike(knowledgeItems.summary, searchPattern)
            )
          )
        )
        .limit(limit)
        .orderBy(desc(knowledgeItems.updatedAt));
      
      categories.knowledge = knowledgeResults.map(k => ({
        id: k.id,
        type: 'knowledge' as const,
        title: k.title,
        description: k.summary || `${k.type} document`,
        url: `/library/${k.id}`,
        icon: 'book',
        metadata: { itemType: k.type },
      }));
    }
    
    // Search creator items
    if (requestedTypes.includes('creator')) {
      const creatorResults = await db
        .select({
          id: creatorItems.id,
          title: creatorItems.title,
          type: creatorItems.type,
          starred: creatorItems.starred,
        })
        .from(creatorItems)
        .where(
          and(
            eq(creatorItems.workspaceId, workspaceId),
            ilike(creatorItems.title, searchPattern)
          )
        )
        .limit(limit)
        .orderBy(desc(creatorItems.updatedAt));
      
      categories.creator = creatorResults.map(c => ({
        id: c.id,
        type: 'creator' as const,
        title: c.title,
        description: `${c.type} document`,
        url: `/creator/${c.id}`,
        icon: 'file-text',
        metadata: { documentType: c.type, starred: c.starred },
      }));
    }
    
    // Search agents
    if (requestedTypes.includes('agents')) {
      const agentResults = await db
        .select({
          id: agents.id,
          name: agents.name,
          description: agents.description,
          type: agents.type,
          status: agents.status,
        })
        .from(agents)
        .where(
          and(
            eq(agents.workspaceId, workspaceId),
            or(
              ilike(agents.name, searchPattern),
              ilike(agents.description, searchPattern)
            )
          )
        )
        .limit(limit)
        .orderBy(desc(agents.updatedAt));
      
      categories.agents = agentResults.map(a => ({
        id: a.id,
        type: 'agent' as const,
        title: a.name,
        description: a.description || `${a.type} agent - ${a.status}`,
        url: `/agents/${a.id}`,
        icon: 'bot',
        metadata: { agentType: a.type, status: a.status },
      }));
    }
    
    // Search blog posts (public, no workspace filter)
    if (requestedTypes.includes('blog')) {
      const blogResults = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          status: blogPosts.status,
        })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, 'published'),
            or(
              ilike(blogPosts.title, searchPattern),
              ilike(blogPosts.excerpt, searchPattern),
              ilike(blogPosts.content, searchPattern)
            )
          )
        )
        .limit(limit)
        .orderBy(desc(blogPosts.publishedAt));
      
      categories.blog = blogResults.map(b => ({
        id: b.id,
        type: 'blog' as const,
        title: b.title,
        description: b.excerpt || 'Blog post',
        url: `/launchpad/${b.slug}`,
        icon: 'newspaper',
        metadata: { slug: b.slug },
      }));
    }
    
    // Flatten all results
    const allResults = [
      ...categories.contacts,
      ...categories.campaigns,
      ...categories.knowledge,
      ...categories.creator,
      ...categories.agents,
      ...categories.blog,
    ];
    
    const response: SearchResponse = {
      query,
      results: allResults,
      categories,
      totalCount: allResults.length,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.error('Search API error', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// Export with rate limiting
export const GET = withRateLimit(searchHandler, {
  limit: 30,
  window: 60, // 30 requests per minute
});

