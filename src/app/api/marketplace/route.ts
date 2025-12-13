import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { marketplaceListings, agents, agentWorkflows } from '@/db/schema';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

const createListingSchema = z.object({
  type: z.enum(['agent', 'workflow']),
  sourceId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(2000),
  shortDescription: z.string().max(200).optional(),
  category: z.string(),
  tags: z.array(z.string()).optional().default([]),
  icon: z.string().optional(),
  version: z.string().optional().default('1.0.0'),
  changelog: z.string().optional(),
});

// GET /api/marketplace - Browse marketplace listings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'agent' | 'workflow' | null;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(marketplaceListings.status, 'published')];

    if (type) {
      conditions.push(eq(marketplaceListings.type, type));
    }

    if (category) {
      conditions.push(eq(marketplaceListings.category, category));
    }

    if (featured) {
      conditions.push(eq(marketplaceListings.isFeatured, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(marketplaceListings.name, `%${search}%`),
          ilike(marketplaceListings.description, `%${search}%`)
        )!
      );
    }

    // Fetch listings
    const listings = await db
      .select()
      .from(marketplaceListings)
      .where(and(...conditions))
      .orderBy(
        featured ? desc(marketplaceListings.featuredOrder) : desc(marketplaceListings.installCount),
        desc(marketplaceListings.averageRating)
      )
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(marketplaceListings)
      .where(and(...conditions));

    // Get categories for filtering
    const categoriesResult = await db
      .selectDistinct({ category: marketplaceListings.category })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.status, 'published'));

    return NextResponse.json({
      listings,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      categories: categoriesResult.map((c: { category: string }) => c.category),
    });
  } catch (error) {
    console.error('Error fetching marketplace:', error);
    return NextResponse.json({ error: 'Failed to fetch marketplace' }, { status: 500 });
  }
}

// POST /api/marketplace - Publish to marketplace
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, workspace: workspaceData, user } = await getCurrentWorkspace();

    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
    }

    const { type, sourceId, name, description, shortDescription, category, tags, icon, version, changelog } = parsed.data;

    // Fetch source resource
    let templateData: Record<string, unknown> = {};

    if (type === 'agent') {
      const agent = await db.query.agents.findFirst({
        where: and(eq(agents.id, sourceId), eq(agents.workspaceId, workspaceId)),
      });
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      templateData = {
        type: agent.type,
        description: agent.description,
        systemPrompt: (agent as Record<string, unknown>).systemPrompt,
        tools: (agent as Record<string, unknown>).tools,
        knowledgeCollectionIds: (agent as Record<string, unknown>).knowledgeCollectionIds,
        aiProvider: (agent as Record<string, unknown>).aiProvider,
        aiModel: (agent as Record<string, unknown>).aiModel,
        temperature: (agent as Record<string, unknown>).temperature,
        maxTokens: (agent as Record<string, unknown>).maxTokens,
        capabilities: (agent as Record<string, unknown>).capabilities,
        settings: (agent as Record<string, unknown>).settings,
      };
    } else {
      const workflow = await db.query.agentWorkflows.findFirst({
        where: and(eq(agentWorkflows.id, sourceId), eq(agentWorkflows.workspaceId, workspaceId)),
      });
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      templateData = {
        description: workflow.description,
        category: workflow.category,
        triggerType: workflow.triggerType,
        triggerConfig: workflow.triggerConfig,
        steps: workflow.steps,
      };
    }

    // Create listing (pending review)
    const [listing] = await db
      .insert(marketplaceListings)
      .values({
        type,
        name,
        description,
        shortDescription,
        category,
        tags,
        icon,
        version,
        changelog,
        sourceAgentId: type === 'agent' ? sourceId : null,
        sourceWorkflowId: type === 'workflow' ? sourceId : null,
        templateData,
        publishedBy: user!.id,
        publisherWorkspaceId: workspaceId,
        publisherName: workspaceData?.name || 'Unknown',
        status: 'published', // Auto-publish for MVP, add review later
        publishedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error) {
    console.error('Error publishing to marketplace:', error);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }
}
