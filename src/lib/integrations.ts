import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface ConnectedApp {
  provider: string;
  type: string;
  scopes: string[];
  accessToken?: string;
  status: string;
}

/**
 * Get all connected apps/integrations for a user in a workspace
 */
export async function getConnectedApps(
  workspaceId: string,
  userId: string
): Promise<ConnectedApp[]> {
  try {
    // Fetch all active integrations for the user
    const userIntegrations = await db.query.integrations.findMany({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.userId, userId),
        eq(integrations.status, 'active')
      ),
      with: {
        tokens: true,
      },
    });

    // Map to ConnectedApp format
    const apps: ConnectedApp[] = userIntegrations.map((integration) => ({
      provider: integration.provider,
      type: integration.type,
      scopes: integration.scopes as string[],
      status: integration.status,
      // Don't expose full token for security, just indicate it exists
      accessToken: integration.tokens?.[0] ? 'CONNECTED' : undefined,
    }));

    logger.debug('Retrieved connected apps for tool context', {
      workspaceId,
      userId,
      count: apps.length,
      providers: apps.map(a => a.provider),
    });

    return apps;
  } catch (error) {
    logger.error('Failed to get connected apps', {
      error: error instanceof Error ? error.message : 'Unknown error',
      workspaceId,
      userId,
    });
    // Return empty array on error so tools can handle gracefully
    return [];
  }
}

/**
 * Check if a specific provider is connected
 */
export function isProviderConnected(
  connectedApps: ConnectedApp[],
  provider: string
): boolean {
  return connectedApps.some(
    (app) => app.provider.toLowerCase() === provider.toLowerCase() && app.status === 'active'
  );
}

/**
 * Get integration for a specific provider
 */
export async function getIntegrationForProvider(
  workspaceId: string,
  userId: string,
  provider: string
): Promise<typeof integrations.$inferSelect | null> {
  try {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.userId, userId),
        eq(integrations.provider, provider as any),
        eq(integrations.status, 'active')
      ),
    });

    return integration || null;
  } catch (error) {
    logger.error('Failed to get integration for provider', {
      error: error instanceof Error ? error.message : 'Unknown error',
      workspaceId,
      userId,
      provider,
    });
    return null;
  }
}
