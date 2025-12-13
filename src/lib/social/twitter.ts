/**
 * Twitter/X API Client
 * 
 * Handles posting tweets and managing Twitter content via Twitter API v2
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

export interface TwitterPostResult {
  success: boolean;
  tweetId?: string;
  url?: string;
  error?: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  profileImageUrl?: string;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get valid access token for Twitter integration
 */
async function getValidAccessToken(
  integrationId: string
): Promise<string> {
  // Get integration and token
  const integration = await db.query.integrations.findFirst({
    where: eq(integrations.id, integrationId),
  });

  if (!integration || integration.provider !== 'twitter') {
    throw new Error('Twitter integration not found');
  }

  const token = await db.query.oauthTokens.findFirst({
    where: eq(oauthTokens.integrationId, integrationId),
    orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
  });

  if (!token) {
    throw new Error('Twitter access token not found');
  }

  // Decrypt access token
  const [iv, authTag, encrypted] = token.accessToken.split(':');
  const accessToken = decryptApiKey({ iv, authTag, encryptedKey: encrypted });

  // Check if token is expired
  const isExpired = token.expiresAt && new Date() >= new Date(token.expiresAt);

  if (isExpired && token.refreshToken) {
    // Refresh the token
    logger.info('Refreshing expired Twitter token', { integrationId });
    
    const [refreshIv, refreshAuthTag, refreshEncrypted] = token.refreshToken.split(':');
    const refreshToken = decryptApiKey({ 
      iv: refreshIv, 
      authTag: refreshAuthTag, 
      encryptedKey: refreshEncrypted 
    });

    try {
      const newTokens = await refreshAccessToken('twitter', refreshToken);
      
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
      logger.error('Failed to refresh Twitter token', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return accessToken;
}

// ============================================================================
// TWITTER API FUNCTIONS
// ============================================================================

/**
 * Get authenticated Twitter user info
 */
export async function getTwitterUser(
  integrationId: string
): Promise<TwitterUser> {
  const accessToken = await getValidAccessToken(integrationId);

  const response = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Twitter user: ${error}`);
  }

  const data = await response.json();
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
    profileImageUrl: data.data.profile_image_url,
  };
}

/**
 * Post a tweet to Twitter
 */
export async function postTweet(
  integrationId: string,
  content: string,
  mediaIds?: string[]
): Promise<TwitterPostResult> {
  try {
    const accessToken = await getValidAccessToken(integrationId);

    // Validate content length (Twitter limit is 280 characters)
    if (content.length > 280) {
      return {
        success: false,
        error: 'Tweet exceeds 280 character limit',
      };
    }

    // Build request body
    const body: Record<string, unknown> = {
      text: content,
    };

    // Add media if provided
    if (mediaIds && mediaIds.length > 0) {
      body.media = {
        media_ids: mediaIds.slice(0, 4), // Twitter allows max 4 media items
      };
    }

    // Post tweet via Twitter API v2
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      logger.error('Twitter API error', { error, status: response.status });
      return {
        success: false,
        error: error.detail || `Twitter API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const tweetId = data.data.id;
    const username = data.data.username || 'twitter';

    return {
      success: true,
      tweetId,
      url: `https://twitter.com/${username}/status/${tweetId}`,
    };
  } catch (error) {
    logger.error('Failed to post tweet', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload media to Twitter (for images/videos)
 * Note: This is a simplified version - full implementation would handle chunked uploads for videos
 */
export async function uploadMedia(
  integrationId: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' = 'image'
): Promise<string | null> {
  try {
    const accessToken = await getValidAccessToken(integrationId);

    // Fetch the media file
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error('Failed to fetch media file');
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const mediaBase64 = Buffer.from(mediaBuffer).toString('base64');

    // Twitter requires media to be uploaded in chunks for large files
    // For simplicity, we'll handle small images (< 5MB) directly
    // Full implementation would use Twitter's chunked upload API

    // Initiate media upload
    const initResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        media_data: mediaBase64,
        media_category: mediaType === 'image' ? 'tweet_image' : 'tweet_video',
      }),
    });

    if (!initResponse.ok) {
      const error = await initResponse.text();
      logger.error('Twitter media upload failed', { error });
      return null;
    }

    const data = await initResponse.json();
    return data.media_id_string || null;
  } catch (error) {
    logger.error('Failed to upload media to Twitter', error);
    return null;
  }
}

/**
 * Get Twitter integration for workspace
 */
export async function getTwitterIntegration(
  workspaceId: string
): Promise<{ id: string; username: string; name: string } | null> {
  const integration = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.provider, 'twitter'),
      eq(integrations.status, 'active')
    ),
  });

  if (!integration) {
    return null;
  }

  try {
    const user = await getTwitterUser(integration.id);
    return {
      id: integration.id,
      username: user.username,
      name: user.name,
    };
  } catch (error) {
    logger.error('Failed to get Twitter user for integration', error);
    return null;
  }
}
