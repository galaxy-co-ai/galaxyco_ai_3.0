/**
 * OAuth 2.0 Authorization Server Metadata
 * 
 * This endpoint provides OAuth discovery information for ChatGPT MCP integration.
 * ChatGPT fetches this to understand how to authenticate users.
 * 
 * Reference: RFC 8414 - OAuth 2.0 Authorization Server Metadata
 * 
 * IMPORTANT: ChatGPT App Store requires Dynamic Client Registration (RFC 7591)
 * The registration_endpoint field is REQUIRED for ChatGPT to connect.
 */

import { NextResponse } from 'next/server';

export async function GET() {
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
