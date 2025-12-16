import { NextRequest, NextResponse } from 'next/server';
import { getOAuthUrl, generatePKCE, oauthProviders, type OAuthProvider } from '@/lib/oauth';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/upstash';

const SUPPORTED_PROVIDERS: OAuthProvider[] = ['google', 'microsoft', 'twitter', 'quickbooks', 'shopify'];

/**
 * Initiate OAuth flow for supported providers
 * GET /api/auth/oauth/[provider]/authorize
 * 
 * For Shopify: requires ?shop=mystore query parameter (without .myshopify.com)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: providerParam } = await params;
    const provider = providerParam as OAuthProvider;

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    await getCurrentUser();

    // Handle Shopify shop domain requirement
    let shopDomain: string | undefined;
    if (provider === 'shopify') {
      const shop = request.nextUrl.searchParams.get('shop');
      if (!shop) {
        return NextResponse.json(
          { error: 'Shopify requires shop parameter (e.g., ?shop=mystore)' },
          { status: 400 }
        );
      }
      // Normalize: remove .myshopify.com if provided
      shopDomain = shop.replace('.myshopify.com', '');
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Generate PKCE for Twitter
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;
    
    if (provider === 'twitter') {
      const pkce = generatePKCE();
      codeVerifier = pkce.codeVerifier;
      codeChallenge = pkce.codeChallenge;
    }

    // Store state and additional data in Redis for validation (10 minute expiration)
    if (redis) {
      await redis.setex(`oauth:state:${state}`, 600, state); // 10 minutes TTL
      if (codeVerifier) {
        await redis.setex(`oauth:code_verifier:${state}`, 600, codeVerifier);
      }
      if (shopDomain) {
        await redis.setex(`oauth:shop_domain:${state}`, 600, shopDomain);
      }
    } else {
      logger.warn('Redis not configured - OAuth state validation will be skipped');
    }

    // Build redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;

    // Get OAuth authorization URL
    let authUrl: string;
    
    if (provider === 'shopify' && shopDomain) {
      // Shopify uses per-shop OAuth URLs
      const config = oauthProviders.shopify;
      const shopAuthUrl = config.authUrl.replace('{shop}', shopDomain);
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        scope: config.scopes.join(','),
        state,
      });
      authUrl = `${shopAuthUrl}?${params.toString()}`;
    } else {
      authUrl = getOAuthUrl(provider, redirectUri, state, codeChallenge);
    }

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


