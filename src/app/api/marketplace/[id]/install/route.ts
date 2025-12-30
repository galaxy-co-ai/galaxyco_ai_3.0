import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { marketplaceListings, marketplaceInstalls, agents, agentWorkflows } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

// POST /api/marketplace/[id]/install - Install from marketplace
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    const { id: listingId } = await params;

    // Fetch listing
    const listing = await db.query.marketplaceListings.findFirst({
      where: and(
        eq(marketplaceListings.id, listingId),
        eq(marketplaceListings.status, 'published')
      ),
    });

    if (!listing) {
      return createErrorResponse(new Error('Listing not found'), 'Install from marketplace');
    }

    // Check if already installed
    const existingInstall = await db.query.marketplaceInstalls.findFirst({
      where: and(
        eq(marketplaceInstalls.listingId, listingId),
        eq(marketplaceInstalls.workspaceId, workspaceId),
        eq(marketplaceInstalls.isActive, true)
      ),
    });

    if (existingInstall) {
      return createErrorResponse(new Error('Already installed - invalid request'), 'Install from marketplace');
    }

    // Create the resource from template
    let createdAgentId: string | null = null;
    let createdWorkflowId: string | null = null;
    const templateData = listing.templateData as Record<string, unknown>;

    if (listing.type === 'agent') {
      const agentType = ((templateData.type as string) || 'custom') as 'scope' | 'call' | 'email' | 'note' | 'task' | 'roadmap' | 'content' | 'custom' | 'browser' | 'cross-app' | 'knowledge' | 'sales' | 'trending' | 'research' | 'meeting' | 'code' | 'data' | 'security';
      const [newAgent] = await db
        .insert(agents)
        .values({
          workspaceId,
          name: `${listing.name} (from Marketplace)`,
          type: agentType,
          description: (templateData.description as string) || '',
          status: 'draft',
          createdBy: user!.id,
        })
        .returning();
      createdAgentId = newAgent.id;
    } else {
      const [newWorkflow] = await db
        .insert(agentWorkflows)
        .values({
          workspaceId,
          name: `${listing.name} (from Marketplace)`,
          description: templateData.description as string,
          category: (templateData.category as string) || 'general',
          triggerType: (templateData.triggerType as 'manual' | 'event' | 'schedule' | 'agent_request') || 'manual',
          triggerConfig: templateData.triggerConfig as Record<string, unknown> || {},
          steps: (templateData.steps as Array<{
            id: string;
            name: string;
            agentId: string;
            action: string;
            inputs: Record<string, unknown>;
            conditions?: Array<{ field: string; operator: string; value: unknown }>;
            onSuccess?: string;
            onFailure?: string;
            timeout?: number;
            retryConfig?: { maxAttempts: number; backoffMs: number };
          }>) || [],
          status: 'draft',
          createdBy: user!.id,
        })
        .returning();
      createdWorkflowId = newWorkflow.id;
    }

    // Record the install
    const [install] = await db
      .insert(marketplaceInstalls)
      .values({
        listingId,
        workspaceId,
        installedBy: user!.id,
        createdAgentId,
        createdWorkflowId,
        installedVersion: listing.version,
        isActive: true,
      })
      .returning();

    // Increment install count
    await db
      .update(marketplaceListings)
      .set({
        installCount: sql`${marketplaceListings.installCount} + 1`,
      })
      .where(eq(marketplaceListings.id, listingId));

    return NextResponse.json({
      install,
      createdResource: {
        type: listing.type,
        id: createdAgentId || createdWorkflowId,
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Install from marketplace');
  }
}
