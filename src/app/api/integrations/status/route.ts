import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const workspaceIntegrations = await db.query.integrations.findMany({
      where: eq(integrations.workspaceId, workspaceId),
    });

    // Map to show connection status
    const integrationStatus = {
      google: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'google' && i.status === 'active'),
      microsoft: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'microsoft' && i.status === 'active'),
      slack: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'slack' && i.status === 'active'),
      salesforce: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'salesforce' && i.status === 'active'),
      hubspot: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'hubspot' && i.status === 'active'),
    };

    return NextResponse.json({
      integrations: workspaceIntegrations.map((i: typeof workspaceIntegrations[0]) => ({
        id: i.id,
        provider: i.provider,
        status: i.status,
        connectedAt: i.createdAt, // Using createdAt as connectedAt
        lastSyncAt: i.lastSyncAt,
      })),
      status: integrationStatus,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get integrations error');
  }
}






