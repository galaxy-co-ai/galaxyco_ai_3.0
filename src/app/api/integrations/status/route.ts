import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { isSignalWireConfigured, getSignalWireConfig } from '@/lib/signalwire';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const workspaceIntegrations = await db.query.integrations.findMany({
      where: eq(integrations.workspaceId, workspaceId),
    });

    // Check SignalWire configuration status
    const signalWireConfigured = isSignalWireConfigured();
    const signalWireConfig = getSignalWireConfig();

    // Map to show connection status
    const integrationStatus = {
      google: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'google' && i.status === 'active'),
      microsoft: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'microsoft' && i.status === 'active'),
      slack: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'slack' && i.status === 'active'),
      salesforce: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'salesforce' && i.status === 'active'),
      hubspot: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'hubspot' && i.status === 'active'),
      twitter: workspaceIntegrations.some((i: typeof workspaceIntegrations[0]) => i.provider === 'twitter' && i.status === 'active'),
      signalwire: signalWireConfigured,
    };

    return NextResponse.json({
      integrations: workspaceIntegrations.map((i: typeof workspaceIntegrations[0]) => ({
        id: i.id,
        provider: i.provider,
        status: i.status,
        connectedAt: i.createdAt,
        lastSyncAt: i.lastSyncAt,
      })),
      status: integrationStatus,
      signalwire: {
        configured: signalWireConfigured,
        phoneNumber: signalWireConfig?.phoneNumber ?? null,
        whatsappNumber: signalWireConfig?.whatsappNumber ?? null,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Get integrations error');
  }
}






