/**
 * MCP OAuth Token Endpoint
 * 
 * Exchanges authorization codes for access tokens.
 * Supports the OAuth 2.0 authorization code flow with PKCE.
 * 
 * Supports both:
 * - Static clients (via MCP_CLIENT_ID/MCP_CLIENT_SECRET env vars)
 * - Dynamic clients (via RFC 7591 registration)
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { authorizationCodes } from '../authorize/route';
import { registeredClients } from '../register/route';

// CORS headers for ChatGPT compatibility
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Get JWT secret from environment
const getJwtSecret = () => {
  const secret = process.env.MCP_JWT_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error('MCP_JWT_SECRET or CLERK_SECRET_KEY must be set');
  }
  return new TextEncoder().encode(secret);
};

// Token store for refresh tokens
const refreshTokens = new Map<string, {
  userId: string;
  workspaceId: string;
  expiresAt: Date;
}>();

// Clean up expired refresh tokens
setInterval(() => {
  const now = new Date();
  for (const [token, data] of refreshTokens.entries()) {
    if (data.expiresAt < now) {
      refreshTokens.delete(token);
    }
  }
}, 300000); // Every 5 minutes

export async function POST(request: Request) {
  try {
    // Parse request body (can be form-encoded or JSON)
    let body: Record<string, string>;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      body = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      body = await request.json();
    }

    const grantType = body.grant_type;
    const clientId = body.client_id;
    const clientSecret = body.client_secret;

    if (!clientId) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate client credentials - support BOTH static and dynamically registered clients
    const staticClientId = process.env.MCP_CLIENT_ID;
    const staticClientSecret = process.env.MCP_CLIENT_SECRET;
    const dynamicClient = registeredClients.get(clientId);
    
    const isStaticClient = staticClientId && clientId === staticClientId;
    const isDynamicClient = !!dynamicClient;

    if (!isStaticClient && !isDynamicClient) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client_id' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Validate client_secret
    if (isStaticClient) {
      // For static clients, validate against env var if secret is provided
      if (clientSecret && staticClientSecret && clientSecret !== staticClientSecret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Invalid client_secret' },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    } else if (isDynamicClient) {
      // For dynamic clients, secret is REQUIRED and must match
      if (!clientSecret || clientSecret !== dynamicClient.clientSecret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Invalid client_secret' },
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }

    if (grantType === 'authorization_code') {
      return handleAuthorizationCode(body);
    } else if (grantType === 'refresh_token') {
      return handleRefreshToken(body);
    } else {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'grant_type must be "authorization_code" or "refresh_token"' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  } catch (error) {
    logger.error('[MCP OAuth] Token exchange failed', { error });
    return NextResponse.json(
      { error: 'server_error', error_description: 'Token exchange failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

async function handleAuthorizationCode(body: Record<string, string>) {
  const code = body.code;
  const redirectUri = body.redirect_uri;
  const codeVerifier = body.code_verifier;

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'code is required' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Look up the authorization code
  const codeData = authorizationCodes.get(code);
  
  if (!codeData) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Check expiration
  if (codeData.expiresAt < new Date()) {
    authorizationCodes.delete(code);
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code has expired' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Validate redirect_uri matches
  if (redirectUri && redirectUri !== codeData.redirectUri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'redirect_uri mismatch' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Validate PKCE code_verifier if code_challenge was used
  if (codeData.codeChallenge) {
    if (!codeVerifier) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'code_verifier is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verify the code challenge
    let computedChallenge: string;
    if (codeData.codeChallengeMethod === 'S256') {
      computedChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64url');
    } else {
      computedChallenge = codeVerifier;
    }

    if (computedChallenge !== codeData.codeChallenge) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid code_verifier' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
  }

  // Delete the authorization code (single use)
  authorizationCodes.delete(code);

  // Generate tokens
  const { accessToken, refreshToken, expiresIn } = await generateTokens(
    codeData.userId,
    codeData.workspaceId
  );

  logger.info('[MCP OAuth] Token generated', {
    userId: codeData.userId,
    workspaceId: codeData.workspaceId,
  });

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    refresh_token: refreshToken,
  }, { headers: CORS_HEADERS });
}

async function handleRefreshToken(body: Record<string, string>) {
  const refreshToken = body.refresh_token;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'refresh_token is required' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Look up the refresh token
  const tokenData = refreshTokens.get(refreshToken);

  if (!tokenData) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid refresh token' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Check expiration
  if (tokenData.expiresAt < new Date()) {
    refreshTokens.delete(refreshToken);
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Refresh token has expired' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Delete old refresh token (rotation)
  refreshTokens.delete(refreshToken);

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken, expiresIn } = await generateTokens(
    tokenData.userId,
    tokenData.workspaceId
  );

  logger.info('[MCP OAuth] Token refreshed', {
    userId: tokenData.userId,
    workspaceId: tokenData.workspaceId,
  });

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: expiresIn,
    refresh_token: newRefreshToken,
  }, { headers: CORS_HEADERS });
}

async function generateTokens(userId: string, workspaceId: string) {
  const secret = getJwtSecret();
  
  // Access token expires in 1 hour
  const expiresIn = 3600;
  const accessToken = await new SignJWT({
    sub: userId,
    workspace_id: workspaceId,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setIssuer('galaxyco-mcp')
    .sign(secret);

  // Refresh token expires in 30 days
  const refreshToken = crypto.randomBytes(32).toString('hex');
  refreshTokens.set(refreshToken, {
    userId,
    workspaceId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return { accessToken, refreshToken, expiresIn };
}

// Export for verifying tokens in SSE endpoint
export async function verifyAccessToken(token: string): Promise<{
  userId: string;
  workspaceId: string;
} | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'galaxyco-mcp',
    });

    if (payload.type !== 'access') {
      return null;
    }

    return {
      userId: payload.sub as string,
      workspaceId: payload.workspace_id as string,
    };
  } catch {
    return null;
  }
}
