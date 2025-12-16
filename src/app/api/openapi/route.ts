import { NextResponse } from 'next/server';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from '@/lib/openapi/registry';
import { baseOpenAPISpec } from '@/lib/openapi/spec';

// Import all path definitions to ensure they're registered
import '@/lib/openapi/schemas/common';
import '@/lib/openapi/paths/assistant';
import '@/lib/openapi/paths/crm';
import '@/lib/openapi/paths/knowledge';
import '@/lib/openapi/paths/workflows';
import '@/lib/openapi/paths/finance';
import '@/lib/openapi/paths/admin';

/**
 * GET /api/openapi
 * 
 * Serves the complete OpenAPI 3.1 specification for GalaxyCo.ai
 * 
 * This is consumed by Scalar UI at /docs/api
 */
export async function GET() {
  try {
    // Generate the OpenAPI document from the registry
    const generator = new OpenApiGeneratorV3(registry.definitions);
    const openApiDoc = generator.generateDocument(baseOpenAPISpec);

    // Return with proper headers for API consumption
    return NextResponse.json(openApiDoc, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*', // Allow CORS for documentation tools
      },
    });
  } catch (error) {
    console.error('Failed to generate OpenAPI spec:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate OpenAPI specification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/openapi
 * 
 * CORS preflight handler
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

