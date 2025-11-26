import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/oauth';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/upstash';
import { createErrorResponse } from '@/lib/api-error-handler';

/**
 * Initiate OAuth flow for Google or Microsoft
 * GET /api/auth/oauth/[provider]/authorize
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerParam } = await params;
    const provider = providerParam as 'google' | 'microsoft';

    if (!['google', 'microsoft'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await getCurrentUser();

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in Redis for validation (10 minute expiration)
    if (redis) {
      await redis.setex(`oauth:state:${state}`, 600, state); // 10 minutes TTL
    } else {
      logger.warn('Redis not configured - OAuth state validation will be skipped');
    }

    // Build redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;

    // Get OAuth authorization URL
    const authUrl = getOAuthUrl(provider, redirectUri, state);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    logger.error('OAuth authorization error', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}


