/**
 * OAuth 2.0 Authorization Server Metadata (Legacy Path)
 *
 * DEPRECATED: Use /.well-known/oauth-authorization-server instead
 * This endpoint is kept for backwards compatibility.
 *
 * Reference: RFC 8414 - OAuth 2.0 Authorization Server Metadata
 */

import { NextResponse } from 'next/server';
import { ensureMcpEnabled, getCorsHeaders } from '@/lib/mcp/cors';

export async function GET(request: Request) {
  const disabled = ensureMcpEnabled();
  if (disabled) {
    return disabled;
  }

  const corsHeaders = getCorsHeaders(request.headers.get('origin'), 'GET, OPTIONS');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.galaxyco.ai';

  const metadata = {
    // Required fields
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/mcp/auth/authorize`,
    token_endpoint: `${baseUrl}/api/mcp/auth/token`,

    // Dynamic Client Registration (REQUIRED for ChatGPT App Store)
    registration_endpoint: `${baseUrl}/api/mcp/auth/register`,

    // Supported response types
    response_types_supported: ['code'],

    // Supported grant types
    grant_types_supported: ['authorization_code', 'refresh_token'],

    // Token endpoint authentication methods
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],

    // PKCE support
    code_challenge_methods_supported: ['S256', 'plain'],

    // Scopes - includes offline_access for refresh tokens (required by ChatGPT)
    scopes_supported: ['openid', 'profile', 'read', 'write', 'offline_access'],

    // Service documentation
    service_documentation: `${baseUrl}/docs/api`,
  };

  return NextResponse.json(metadata, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function OPTIONS(request: Request) {
  const disabled = ensureMcpEnabled();
  if (disabled) {
    return disabled;
  }

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get('origin'), 'GET, OPTIONS'),
  });
}
