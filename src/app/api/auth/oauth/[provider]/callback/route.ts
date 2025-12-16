import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, oauthProviders, type OAuthProvider } from '@/lib/oauth';
import { db } from '@/lib/db';
import { getCurrentWorkspace } from '@/lib/auth';
import { integrations, oauthTokens } from '@/db/schema';
import { encryptApiKey } from '@/lib/encryption';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/upstash';

const SUPPORTED_PROVIDERS: OAuthProvider[] = ['google', 'microsoft', 'twitter', 'quickbooks', 'shopify'];

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
    const provider = providerParam as OAuthProvider;
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // QuickBooks returns realmId (company ID) in callback
    const realmId = searchParams.get('realmId');

    // Validate provider
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connected-apps?error=invalid_provider`
      );
    }

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connected-apps?error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connected-apps?error=missing_params`
      );
    }

    // Validate state token with Redis to prevent CSRF attacks
    let codeVerifier: string | undefined;
    let shopDomain: string | undefined;
    
    if (redis) {
      const storedState = await redis.get(`oauth:state:${state}`);
      if (!storedState || storedState !== state) {
        logger.warn('OAuth state validation failed', { state, storedState });
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/connected-apps?error=invalid_state`
        );
      }
      // Delete state after validation (one-time use)
      await redis.del(`oauth:state:${state}`);
      
      // Get code verifier for Twitter PKCE
      if (provider === 'twitter') {
        codeVerifier = await redis.get(`oauth:code_verifier:${state}`) || undefined;
        if (codeVerifier) {
          await redis.del(`oauth:code_verifier:${state}`);
        }
      }
      
      // Get shop domain for Shopify
      if (provider === 'shopify') {
        shopDomain = await redis.get(`oauth:shop_domain:${state}`) || undefined;
        if (shopDomain) {
          await redis.del(`oauth:shop_domain:${state}`);
        }
      }
    } else {
      // Fallback: Basic state validation if Redis is not configured
      logger.warn('OAuth state validation skipped - Redis not configured');
    }

    // Get current workspace
    const { workspaceId, user } = await getCurrentWorkspace();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connected-apps?error=user_not_found`
      );
    }

    // Build redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;
    
    // Exchange code for tokens (Shopify needs special handling)
    let tokens: { accessToken: string; refreshToken?: string; expiresIn: number; tokenType: string };
    
    if (provider === 'shopify' && shopDomain) {
      tokens = await exchangeShopifyCode(shopDomain, code, redirectUri);
    } else {
      tokens = await exchangeCodeForToken(provider, code, redirectUri, codeVerifier);
    }

    // Encrypt tokens for storage
    const encryptedAccess = encryptApiKey(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken
      ? encryptApiKey(tokens.refreshToken)
      : null;

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

    // Get user/account info from provider
    const userInfo = await getUserInfo(provider, tokens.accessToken, { realmId, shopDomain });

    // Determine integration type and build config
    let integrationType = 'email';
    let integrationConfig: Record<string, unknown> = {};
    
    if (provider === 'google') {
      integrationType = 'gmail';
    } else if (provider === 'microsoft') {
      integrationType = 'outlook';
    } else if (provider === 'twitter') {
      integrationType = 'twitter';
    } else if (provider === 'quickbooks') {
      integrationType = 'accounting';
      integrationConfig = { realmId, companyId: realmId };
    } else if (provider === 'shopify') {
      integrationType = 'ecommerce';
      integrationConfig = { shopDomain: `${shopDomain}.myshopify.com` };
    }

    // Store integration in database
    const [integration] = await db
      .insert(integrations)
      .values({
        workspaceId,
        userId: user.id,
        provider,
        type: integrationType,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Integration`,
        status: 'active',
        providerAccountId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name,
        profileImage: userInfo.picture,
        scopes: userInfo.scopes || [],
        config: integrationConfig,
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

    // Redirect to appropriate page based on provider
    const successRedirect = (provider === 'quickbooks' || provider === 'shopify')
      ? '/finance-hq'
      : '/connected-apps';
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${successRedirect}?success=${provider}`
    );
  } catch (error) {
    logger.error('OAuth callback error', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connected-apps?error=callback_failed`
    );
  }
}

/**
 * Exchange Shopify authorization code for access token
 * Shopify uses a different token endpoint per shop
 */
async function exchangeShopifyCode(
  shopDomain: string,
  code: string,
  _redirectUri: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}> {
  const config = oauthProviders.shopify;
  const tokenUrl = config.tokenUrl.replace('{shop}', shopDomain);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Shopify token exchange failed: ${error}`);
  }

  const data = await response.json();
  
  return {
    accessToken: data.access_token,
    // Shopify access tokens don't expire (offline access)
    expiresIn: 365 * 24 * 60 * 60, // 1 year placeholder
    tokenType: 'Bearer',
  };
}

/**
 * Get user/account info from OAuth provider
 */
async function getUserInfo(
  provider: OAuthProvider,
  accessToken: string,
  context?: { realmId?: string | null; shopDomain?: string }
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
  } else if (provider === 'microsoft') {
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
  } else if (provider === 'twitter') {
    const response = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,username',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Twitter user info');
    }

    const data = await response.json();
    const user = data.data;
    
    return {
      id: user.id,
      email: `@${user.username}`,
      name: user.name || user.username,
      picture: user.profile_image_url,
    };
  } else if (provider === 'quickbooks') {
    // QuickBooks: Get company info using realmId
    if (!context?.realmId) {
      throw new Error('QuickBooks realmId not provided');
    }
    
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${context.realmId}/companyinfo/${context.realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Fallback if company info fetch fails
      logger.warn('Failed to fetch QuickBooks company info, using defaults');
      return {
        id: context.realmId,
        email: 'quickbooks@connected',
        name: 'QuickBooks Company',
      };
    }

    const data = await response.json();
    const company = data.CompanyInfo;
    
    return {
      id: context.realmId,
      email: company.Email?.Address || company.CompanyEmail || 'quickbooks@connected',
      name: company.CompanyName || 'QuickBooks Company',
    };
  } else if (provider === 'shopify') {
    // Shopify: Get shop info
    if (!context?.shopDomain) {
      throw new Error('Shopify shop domain not provided');
    }
    
    const response = await fetch(
      `https://${context.shopDomain}.myshopify.com/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      }
    );

    if (!response.ok) {
      // Fallback if shop info fetch fails
      logger.warn('Failed to fetch Shopify shop info, using defaults');
      return {
        id: context.shopDomain,
        email: 'shopify@connected',
        name: context.shopDomain,
      };
    }

    const data = await response.json();
    const shop = data.shop;
    
    return {
      id: String(shop.id),
      email: shop.email || 'shopify@connected',
      name: shop.name || context.shopDomain,
    };
  }
  
  throw new Error(`Unsupported provider: ${provider}`);
}


