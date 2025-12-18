/**
 * Facebook API Client
 * 
 * Handles posting updates and managing Facebook content via Graph API
 */

import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptApiKey } from '@/lib/encryption';
import { refreshAccessToken } from '@/lib/oauth';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FacebookPostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface FacebookUser {
  id: string;
  name: string;
  profileImageUrl?: string;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get valid access token for Facebook integration
 */
async function getValidAccessToken(
  integrationId: string
): Promise<string> {
  // Get integration and token
  const integration = await db.query.integrations.findFirst({
    where: eq(integrations.id, integrationId),
  });

  if (!integration || integration.provider !== 'facebook') {
    throw new Error('Facebook integration not found');
  }

  const token = await db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.integrationId, integrationId),
    orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
  });

  if (!token) {
    throw new Error('Facebook access token not found');
  }

  // Decrypt access token
  const [iv, authTag, encrypted] = token.accessToken.split(':');
  const accessToken = decryptApiKey({ iv, authTag, encryptedKey: encrypted });

  // Check if token is expired
  const isExpired = token.expiresAt && new Date() >= new Date(token.expiresAt);

  if (isExpired && token.refreshToken) {
    // Refresh the token
    logger.info('Refreshing expired Facebook token', { integrationId });
    
    const [refreshIv, refreshAuthTag, refreshEncrypted] = token.refreshToken.split(':');
    const refreshToken = decryptApiKey({ 
      iv: refreshIv, 
      authTag: refreshAuthTag, 
      encryptedKey: refreshEncrypted 
    });

    try {
      const newTokens = await refreshAccessToken('facebook', refreshToken);
      
      // Update token in database
      const { encryptApiKey } = await import('@/lib/encryption');
      const encryptedAccess = encryptApiKey(newTokens.accessToken);
      const accessTokenStr = `${encryptedAccess.iv}:${encryptedAccess.authTag}:${encryptedAccess.encryptedKey}`;
      
      const expiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);
      
      await db
        .update(oauthTokens)
        .set({
          accessToken: accessTokenStr,
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(oauthTokens.id, token.id));

      return newTokens.accessToken;
    } catch (error) {
      logger.error('Failed to refresh Facebook token', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return accessToken;
}

// ============================================================================
// FACEBOOK API FUNCTIONS
// ============================================================================

/**
 * Get authenticated Facebook user info
 */
export async function getFacebookUser(
  integrationId: string
): Promise<FacebookUser> {
  const accessToken = await getValidAccessToken(integrationId);

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,picture&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Facebook user: ${error}`);
  }

  const data = await response.json();
  
  return {
    id: data.id,
    name: data.name,
    profileImageUrl: data.picture?.data?.url,
  };
}

/**
 * Post an update to Facebook
 */
export async function postFacebookUpdate(
  integrationId: string,
  content: string
): Promise<FacebookPostResult> {
  try {
    const accessToken = await getValidAccessToken(integrationId);

    // Get user ID
    const userResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );

    if (!userResponse.ok) {
      throw new Error('Failed to get Facebook user ID');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Validate content length (Facebook has no strict limit, but 63,206 is recommended)
    if (content.length > 63206) {
      return {
        success: false,
        error: 'Facebook post exceeds recommended character limit',
      };
    }

    // Post to Facebook Feed via Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          access_token: accessToken,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      logger.error('Facebook API error', { error, status: response.status });
      return {
        success: false,
        error: error.error?.message || `Facebook API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const postId = data.id;

    return {
      success: true,
      postId,
      url: `https://www.facebook.com/${postId}`,
    };
  } catch (error) {
    logger.error('Failed to post Facebook update', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Facebook integration for workspace
 */
export async function getFacebookIntegration(
  workspaceId: string
): Promise<{ id: string; name: string } | null> {
  const integration = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.provider, 'facebook'),
      eq(integrations.status, 'active')
    ),
  });

  if (!integration) {
    return null;
  }

  try {
    const user = await getFacebookUser(integration.id);
    return {
      id: integration.id,
      name: user.name,
    };
  } catch (error) {
    logger.error('Failed to get Facebook user for integration', error);
    return null;
  }
}
