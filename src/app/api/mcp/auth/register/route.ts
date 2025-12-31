/**
 * MCP OAuth Dynamic Client Registration (RFC 7591)
 * 
 * ChatGPT dynamically registers itself as an OAuth client.
 * This endpoint accepts registration requests and returns client credentials.
 * 
 * Reference: https://www.rfc-editor.org/rfc/rfc7591
 * 
 * Flow:
 * 1. ChatGPT POSTs registration request with redirect_uris
 * 2. We generate client_id and client_secret
 * 3. Return credentials to ChatGPT
 * 4. ChatGPT uses these for subsequent OAuth flows
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { OAuthClientRegistrationSchema } from '@/lib/validation/schemas';

// Interface for registered client data
interface RegisteredClient {
  clientId: string;
  clientSecret: string;
  clientName: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  tokenEndpointAuthMethod: string;
  createdAt: Date;
}

// In-memory store for dynamically registered clients
// TODO: Migrate to database or Redis in production for persistence across deployments
const registeredClients = new Map<string, RegisteredClient>();

// Clean up old clients periodically (optional - clients don't expire by default)
// Uncomment if you want clients to expire after 30 days
// setInterval(() => {
//   const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
//   for (const [id, client] of registeredClients.entries()) {
//     if (client.createdAt < thirtyDaysAgo) {
//       registeredClients.delete(id);
//       logger.info('[MCP OAuth] Expired client removed', { clientId: id });
//     }
//   }
// }, 86400000); // Daily cleanup

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate registration data using Zod schema (RFC 7591 compliant)
    const validation = OAuthClientRegistrationSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      // Map Zod errors to OAuth error format
      if (firstError?.path.includes('redirect_uris')) {
        return NextResponse.json(
          {
            error: 'invalid_redirect_uri',
            error_description: firstError.message
          },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      return NextResponse.json(
        {
          error: 'invalid_client_metadata',
          error_description: firstError?.message || 'Validation failed'
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Extract validated registration data
    const {
      client_name,
      redirect_uris,
      grant_types,
      response_types,
      token_endpoint_auth_method,
      scope,
      contacts,
      logo_uri,
      client_uri,
      policy_uri,
      tos_uri,
    } = validation.data;

    // Generate client credentials
    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomBytes(32).toString('hex');

    // Store the registered client
    const registeredClient: RegisteredClient = {
      clientId,
      clientSecret,
      clientName: client_name,
      redirectUris: redirect_uris,
      grantTypes: grant_types,
      responseTypes: response_types,
      tokenEndpointAuthMethod: token_endpoint_auth_method,
      createdAt: new Date(),
    };
    
    registeredClients.set(clientId, registeredClient);

    logger.info('[MCP OAuth] Client registered dynamically', {
      clientId,
      clientName: client_name,
      redirectUris: redirect_uris,
    });

    // Return the registration response per RFC 7591
    const response = {
      // Required fields
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      // client_secret_expires_at: 0 means no expiration
      client_secret_expires_at: 0,
      
      // Echo back the registered metadata
      client_name,
      redirect_uris,
      grant_types,
      response_types,
      token_endpoint_auth_method,
      
      // Include optional fields if provided
      ...(scope && { scope }),
      ...(contacts && { contacts }),
      ...(logo_uri && { logo_uri }),
      ...(client_uri && { client_uri }),
      ...(policy_uri && { policy_uri }),
      ...(tos_uri && { tos_uri }),
    };

    return NextResponse.json(response, {
      status: 201,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('[MCP OAuth] Client registration failed', { error });
    return NextResponse.json(
      { error: 'server_error', error_description: 'Registration failed' },
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

// Export for use by authorize/token endpoints
export { registeredClients };
export type { RegisteredClient };

