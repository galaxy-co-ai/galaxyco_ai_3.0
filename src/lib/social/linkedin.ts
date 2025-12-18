/**
 * LinkedIn API Client
 * 
 * Handles posting updates and managing LinkedIn content via LinkedIn API v2
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

export interface LinkedInPostResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

export interface LinkedInUser {
  id: string;
  name: string;
  profileImageUrl?: string;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get valid access token for LinkedIn integration
 */
async function getValidAccessToken(
  integrationId: string
): Promise<string> {
  // Get integration and token
  const integration = await db.query.integrations.findFirst({
    where: eq(integrations.id, integrationId),
  });

  if (!integration || integration.provider !== 'linkedin') {
    throw new Error('LinkedIn integration not found');
  }

  const token = await db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.integrationId, integrationId),
    orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
  });

  if (!token) {
    throw new Error('LinkedIn access token not found');
  }

  // Decrypt access token
  const [iv, authTag, encrypted] = token.accessToken.split(':');
  const accessToken = decryptApiKey({ iv, authTag, encryptedKey: encrypted });

  // Check if token is expired
  const isExpired = token.expiresAt && new Date() >= new Date(token.expiresAt);

  if (isExpired && token.refreshToken) {
    // Refresh the token
    logger.info('Refreshing expired LinkedIn token', { integrationId });
    
    const [refreshIv, refreshAuthTag, refreshEncrypted] = token.refreshToken.split(':');
    const refreshToken = decryptApiKey({ 
      iv: refreshIv, 
      authTag: refreshAuthTag, 
      encryptedKey: refreshEncrypted 
    });

    try {
      const newTokens = await refreshAccessToken('linkedin', refreshToken);
      
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
      logger.error('Failed to refresh LinkedIn token', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return accessToken;
}

// ============================================================================
// LINKEDIN API FUNCTIONS
// ============================================================================

/**
 * Get authenticated LinkedIn user info
 */
export async function getLinkedInUser(
  integrationId: string
): Promise<LinkedInUser> {
  const accessToken = await getValidAccessToken(integrationId);

  const response = await fetch(
    'https://api.linkedin.com/v2/me',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch LinkedIn user: ${error}`);
  }

  const data = await response.json();
  
  // Get profile picture if available
  let profileImageUrl: string | undefined;
  try {
    const pictureResponse = await fetch(
      'https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~:playableStreams))',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (pictureResponse.ok) {
      const pictureData = await pictureResponse.json();
      const displayImage = pictureData.profilePicture?.['displayImage~']?.elements?.[0];
      profileImageUrl = displayImage?.identifiers?.[0]?.identifier;
    }
  } catch (err) {
    logger.warn('Failed to fetch LinkedIn profile picture', err instanceof Error ? err : { error: String(err) });
  }

  return {
    id: data.id,
    name: `${data.localizedFirstName} ${data.localizedLastName}`,
    profileImageUrl,
  };
}

/**
 * Post an update to LinkedIn
 */
export async function postLinkedInUpdate(
  integrationId: string,
  content: string
): Promise<LinkedInPostResult> {
  try {
    const accessToken = await getValidAccessToken(integrationId);

    // Get user ID (person URN)
    const userResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get LinkedIn user ID');
    }

    const userData = await userResponse.json();
    const personUrn = `urn:li:person:${userData.id}`;

    // Validate content length (LinkedIn allows up to 3000 characters)
    if (content.length > 3000) {
      return {
        success: false,
        error: 'LinkedIn post exceeds 3000 character limit',
      };
    }

    // Create post via LinkedIn UGC API
    const postBody = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      logger.error('LinkedIn API error', { error, status: response.status });
      return {
        success: false,
        error: error.message || `LinkedIn API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const postId = data.id;

    return {
      success: true,
      postId,
      url: `https://www.linkedin.com/feed/update/${postId}`,
    };
  } catch (error) {
    logger.error('Failed to post LinkedIn update', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get LinkedIn integration for workspace
 */
export async function getLinkedInIntegration(
  workspaceId: string
): Promise<{ id: string; name: string } | null> {
  const integration = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.provider, 'linkedin'),
      eq(integrations.status, 'active')
    ),
  });

  if (!integration) {
    return null;
  }

  try {
    const user = await getLinkedInUser(integration.id);
    return {
      id: integration.id,
      name: user.name,
    };
  } catch (error) {
    logger.error('Failed to get LinkedIn user for integration', error);
    return null;
  }
}
