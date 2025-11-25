import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const workspaceIntegrations = await db.query.integrations.findMany({
      where: eq(integrations.workspaceId, workspaceId),
    });

    // Map to show connection status
    const integrationStatus = {
      google: workspaceIntegrations.some((i) => i.provider === 'google' && i.status === 'active'),
      microsoft: workspaceIntegrations.some((i) => i.provider === 'microsoft' && i.status === 'active'),
      slack: workspaceIntegrations.some((i) => i.provider === 'slack' && i.status === 'active'),
      salesforce: workspaceIntegrations.some((i) => i.provider === 'salesforce' && i.status === 'active'),
      hubspot: workspaceIntegrations.some((i) => i.provider === 'hubspot' && i.status === 'active'),
    };

    return NextResponse.json({
      integrations: workspaceIntegrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        status: i.status,
        connectedAt: i.createdAt, // Using createdAt as connectedAt
        lastSyncAt: i.lastSyncAt,
      })),
      status: integrationStatus,
    });
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}






