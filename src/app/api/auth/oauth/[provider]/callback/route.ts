import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/oauth';
import { db } from '@/lib/db';
import { getCurrentWorkspace } from '@/lib/auth';
import { integrations, oauthTokens } from '@/db/schema';
import { encryptApiKey } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/upstash';
import { createErrorResponse } from '@/lib/api-error-handler';

/**
 * OAuth callback handler
 * GET /api/auth/oauth/[provider]/callback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerParam } = await params;
    const provider = providerParam as 'google' | 'microsoft';
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=missing_params`
      );
    }

    // Validate state token with Redis to prevent CSRF attacks
    if (redis) {
      const storedState = await redis.get(`oauth:state:${state}`);
      if (!storedState || storedState !== state) {
        logger.warn('OAuth state validation failed', { state, storedState });
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=invalid_state`
        );
      }
      // Delete state after validation (one-time use)
      await redis.del(`oauth:state:${state}`);
    } else {
      // Fallback: Basic state validation if Redis is not configured
      // In production, Redis should be configured for proper security
      logger.warn('OAuth state validation skipped - Redis not configured');
    }

    // Get current workspace
    const { workspaceId, user, userId } = await getCurrentWorkspace();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=user_not_found`
      );
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;
    const tokens = await exchangeCodeForToken(provider, code, redirectUri);

    // Encrypt tokens for storage
    const encryptedAccess = encryptApiKey(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? encryptApiKey(tokens.refreshToken)
      : null;

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Get user info from provider
    const userInfo = await getUserInfo(provider, tokens.accessToken);

    // Store integration in database
    const [integration] = await db
      .insert(integrations)
      .values({
        workspaceId,
        userId: user.id,
        provider,
        type: provider === 'google' ? 'gmail' : 'outlook',
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
        status: 'active',
        providerAccountId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name,
        profileImage: userInfo.picture,
        scopes: userInfo.scopes || [],
      })
      .returning();

    // Store OAuth tokens (combine encrypted parts into single string)
    const accessTokenStr = `${encryptedAccess.iv}:${encryptedAccess.authTag}:${encryptedAccess.encryptedKey}`;
    const refreshTokenStr = encryptedRefresh 
      ? `${encryptedRefresh.iv}:${encryptedRefresh.authTag}:${encryptedRefresh.encryptedKey}`
      : null;

    await db.insert(oauthTokens).values({
      integrationId: integration.id,
      accessToken: accessTokenStr,
      refreshToken: refreshTokenStr,
      expiresAt,
      tokenType: tokens.tokenType,
    });

    // Redirect to integrations page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?success=${provider}`
    );
  } catch (error) {
    logger.error('OAuth callback error', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/integrations?error=callback_failed`
    );
  }
}

/**
 * Get user info from OAuth provider
 */
async function getUserInfo(
  provider: 'google' | 'microsoft',
  accessToken: string
): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  scopes?: string[];
}> {
  if (provider === 'google') {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } else {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Microsoft user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.mail || data.userPrincipalName,
      name: data.displayName,
    };
  }
}


