/**
 * MCP OAuth Authorization Endpoint
 * 
 * Handles the OAuth 2.0 authorization flow for ChatGPT MCP integration.
 * Users are redirected here to authorize Neptune access to their GalaxyCo workspace.
 * 
 * Supports both:
 * - Static clients (via MCP_CLIENT_ID env var)
 * - Dynamic clients (via RFC 7591 registration)
 */

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { registeredClients } from '../register/route';

// In-memory store for authorization codes (use Redis in production)
// This is fine for MVP - codes expire in 10 minutes anyway
const authorizationCodes = new Map<string, {
  userId: string;
  workspaceId: string;
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  expiresAt: Date;
}>();

// Clean up expired codes periodically
setInterval(() => {
  const now = new Date();
  for (const [code, data] of authorizationCodes.entries()) {
    if (data.expiresAt < now) {
      authorizationCodes.delete(code);
    }
  }
}, 60000); // Every minute

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const responseType = url.searchParams.get('response_type');
    const clientId = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state');
    const codeChallenge = url.searchParams.get('code_challenge');
    const codeChallengeMethod = url.searchParams.get('code_challenge_method');

    // Validate required parameters
    if (responseType !== 'code') {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'response_type must be "code"' },
        { status: 400 }
      );
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id is required' },
        { status: 400 }
      );
    }

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'redirect_uri is required' },
        { status: 400 }
      );
    }

    // Validate client_id - support BOTH static and dynamically registered clients
    const staticClientId = process.env.MCP_CLIENT_ID;
    const dynamicClient = registeredClients.get(clientId);
    const isStaticClient = staticClientId && clientId === staticClientId;
    const isDynamicClient = !!dynamicClient;

    if (!isStaticClient && !isDynamicClient) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client_id' },
        { status: 401 }
      );
    }

    // For dynamic clients, validate redirect_uri against registered URIs
    if (isDynamicClient) {
      const isValidRedirect = dynamicClient.redirectUris.some(uri => 
        redirectUri === uri || redirectUri.startsWith(uri)
      );
      if (!isValidRedirect) {
        logger.warn('[MCP OAuth] Invalid redirect_uri for dynamic client', {
          clientId,
          requestedUri: redirectUri,
          registeredUris: dynamicClient.redirectUris,
        });
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'redirect_uri not registered for this client' },
          { status: 400 }
        );
      }
    }

    // Get current user from Clerk
    const { userId, orgId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      // User not logged in - redirect to login with return URL
      const loginUrl = new URL('/sign-in', request.url);
      loginUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Get workspace ID (use org if available, otherwise user's default workspace)
    const workspaceId = orgId || userId;

    // Generate authorization code
    const code = crypto.randomBytes(32).toString('hex');
    
    // Store the code with metadata
    authorizationCodes.set(code, {
      userId,
      workspaceId,
      redirectUri,
      codeChallenge: codeChallenge || undefined,
      codeChallengeMethod: codeChallengeMethod || undefined,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    logger.info('[MCP OAuth] Authorization code generated', {
      userId,
      workspaceId,
      redirectUri,
    });

    // Build redirect URL with code and state
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', code);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    return NextResponse.redirect(callbackUrl.toString());
  } catch (error) {
    logger.error('[MCP OAuth] Authorization failed', { error });
    return NextResponse.json(
      { error: 'server_error', error_description: 'Authorization failed' },
      { status: 500 }
    );
  }
}

// Export for use by token endpoint
export { authorizationCodes };
