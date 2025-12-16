/**
 * OAuth Configuration for Google, Microsoft, QuickBooks, and Shopify Integrations
 * Supports Gmail, Google Calendar, Outlook, Microsoft Calendar, and Finance HQ
 */

import crypto from 'crypto';

export type OAuthProvider = 'google' | 'microsoft' | 'quickbooks' | 'shopify' | 'twitter';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

/**
 * OAuth provider configurations
 */
export const oauthProviders: Record<OAuthProvider, OAuthConfig> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Calendars.Read',
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'offline_access',
    ],
  },
  quickbooks: {
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    authUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    scopes: [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
      'openid',
      'profile',
      'email',
    ],
  },
  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
    // Note: Shopify uses per-shop OAuth URLs
    // The {shop} placeholder is replaced at runtime with the actual shop domain
    authUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
    tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
    scopes: [
      'read_orders',
      'read_products',
      'read_customers',
      'read_shopify_payments_payouts',
      'read_shopify_payments_disputes',
    ],
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID || '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: [
      'tweet.read',
      'tweet.write',
      'users.read',
      'offline.access', // For refresh tokens
    ],
  },
};

/**
 * Generate PKCE code verifier and challenge for OAuth 2.0
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  // Generate code verifier (random string)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  
  // Generate code challenge (SHA256 hash of verifier)
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  
  return { codeVerifier, codeChallenge };
}

/**
 * Generate OAuth authorization URL
 */
export function getOAuthUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string,
  codeChallenge?: string // For Twitter PKCE
): string {
  const config = oauthProviders[provider];

  if (!config.clientId) {
    throw new Error(`${provider.toUpperCase()}_CLIENT_ID not configured`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
  });

  // Twitter requires PKCE
  if (provider === 'twitter' && codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  } else if (provider !== 'twitter') {
    // Other providers use standard OAuth
    params.append('access_type', 'offline'); // For refresh tokens
    params.append('prompt', 'consent'); // Force consent screen to get refresh token
  }

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
  codeVerifier?: string // For Twitter PKCE
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}> {
  const config = oauthProviders[provider];

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider.toUpperCase()} OAuth credentials not configured`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  // Twitter uses PKCE (code_verifier) instead of client_secret
  if (provider === 'twitter') {
    if (!codeVerifier) {
      throw new Error('Code verifier required for Twitter OAuth');
    }
    params.append('code_verifier', codeVerifier);
  } else {
    // Other providers use client_secret
    params.append('client_secret', config.clientSecret);
  }

  // Twitter requires Basic Auth header instead of client_secret in body
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (provider === 'twitter') {
    // Twitter requires Basic Auth with client_id:client_secret
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 7200, // Default 2 hours if not provided
    tokenType: data.token_type || 'Bearer',
  };
}

/**
 * Refresh an access token using refresh token
 */
export async function refreshAccessToken(
  provider: OAuthProvider,
  refreshToken: string
): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const config = oauthProviders[provider];

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider.toUpperCase()} OAuth credentials not configured`);
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  // Twitter requires Basic Auth header
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (provider === 'twitter') {
    // Twitter uses Basic Auth
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  } else {
    // Other providers include client credentials in body
    params.append('client_id', config.clientId);
    params.append('client_secret', config.clientSecret);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 7200, // Default 2 hours if not provided
  };
}

/**
 * Check if OAuth provider is configured
 */
export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  const config = oauthProviders[provider];
  return !!(config.clientId && config.clientSecret);
}















