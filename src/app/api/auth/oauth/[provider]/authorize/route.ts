import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/oauth';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

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

    // Store state in session/redis for validation (simplified here)
    // In production, store in Redis with expiration
    const stateData = {
      userId: user.id,
      provider,
      timestamp: Date.now(),
    };

    // Build redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;

    // Get OAuth authorization URL
    const authUrl = getOAuthUrl(provider, redirectUri, state);

    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}


