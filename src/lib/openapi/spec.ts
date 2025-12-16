import type { OpenAPIObjectConfig } from '@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator';

/**
 * Base OpenAPI 3.1 Specification for GalaxyCo.ai
 * 
 * This is the foundation for our interactive API documentation.
 * Routes are registered via the registry and assembled dynamically.
 */
export const baseOpenAPISpec: OpenAPIObjectConfig = {
  openapi: '3.1.0',
  info: {
    title: 'GalaxyCo.ai API',
    version: '3.0.0',
    description: `
# GalaxyCo.ai API Documentation

Welcome to the GalaxyCo.ai API! This is a comprehensive AI-native business operations platform.

## Features

- 🤖 **Neptune AI** - Intelligent assistant with 50+ business tools
- 👥 **CRM** - Complete customer relationship management
- 📚 **Knowledge Base** - Document storage with semantic search
- ⚙️ **Workflows** - Visual workflow automation (Galaxy Grids)
- 💰 **Finance** - Invoice and expense tracking
- 📊 **Marketing** - Campaign and channel management
- 🎨 **Creator Studio** - AI-powered content creation

## Authentication

All endpoints require authentication via Clerk. Include your session token:

\`\`\`
Authorization: Bearer <clerk-session-token>
\`\`\`

## Rate Limiting

Rate limits vary by endpoint type:
- AI endpoints: 20 requests/minute
- Search endpoints: 30 requests/minute
- CRUD endpoints: 100 requests/hour

Rate limit info is included in response headers:
- \`X-RateLimit-Limit\`
- \`X-RateLimit-Remaining\`
- \`X-RateLimit-Reset\`

## Multi-Tenancy

All data is isolated by workspace. The \`organizationId\` is automatically extracted from your authentication token.
    `,
    contact: {
      name: 'GalaxyCo.ai Support',
      email: 'support@galaxyco.ai',
      url: 'https://galaxyco.ai/support',
    },
    license: {
      name: 'Proprietary',
      url: 'https://galaxyco.ai/terms',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
    {
      url: 'https://galaxyco.ai',
      description: 'Production',
    },
  ],
  tags: [
    {
      name: 'AI & Assistant',
      description: 'Neptune AI chat, insights, and voice capabilities',
    },
    {
      name: 'CRM',
      description: 'Contacts, deals, customers, prospects, and projects',
    },
    {
      name: 'Knowledge Base',
      description: 'Document storage, upload, and semantic search',
    },
    {
      name: 'Workflows',
      description: 'Visual workflow builder and execution (Galaxy Grids)',
    },
    {
      name: 'Orchestration',
      description: 'Multi-agent teams, approvals, and coordination',
    },
    {
      name: 'Finance',
      description: 'Invoices, expenses, revenue tracking',
    },
    {
      name: 'Content & Admin',
      description: 'Blog posts, topics, sources, and content management',
    },
    {
      name: 'Marketing',
      description: 'Campaigns and marketing channels',
    },
    {
      name: 'Creator Studio',
      description: 'AI-powered content creation and templates',
    },
    {
      name: 'Settings',
      description: 'User, workspace, and team configuration',
    },
    {
      name: 'System',
      description: 'Health checks, status, and system information',
    },
  ],
  // Components, security, and paths are managed by the OpenAPI generator from the registry
};

