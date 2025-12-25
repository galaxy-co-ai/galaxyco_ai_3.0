/**
 * Backend Integration Status Report
 * Tests all environment variables and integrations
 */

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  status: 'ready' | 'missing' | 'partial';
  message: string;
}

export function checkBackendIntegrations(): IntegrationStatus[] {
  const integrations: IntegrationStatus[] = [];

  // Database
  integrations.push({
    name: 'Neon Database',
    configured: !!process.env.DATABASE_URL,
    status: process.env.DATABASE_URL ? 'ready' : 'missing',
    message: process.env.DATABASE_URL
      ? '✅ Connected to Neon PostgreSQL'
      : '❌ DATABASE_URL not configured',
  });

  // Authentication
  integrations.push({
    name: 'Clerk Authentication',
    configured: !!(process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    status:
      process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        ? 'ready'
        : 'missing',
    message:
      process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        ? '✅ Clerk keys configured'
        : '❌ Clerk keys missing',
  });

  // Encryption
  integrations.push({
    name: 'API Key Encryption',
    configured: !!process.env.ENCRYPTION_KEY,
    status: process.env.ENCRYPTION_KEY ? 'ready' : 'missing',
    message: process.env.ENCRYPTION_KEY
      ? '✅ Encryption key configured'
      : '❌ ENCRYPTION_KEY not set',
  });

  // AI Providers
  const aiProviders: string[] = [];
  if (process.env.OPENAI_API_KEY) aiProviders.push('OpenAI');
  if (process.env.ANTHROPIC_API_KEY) aiProviders.push('Claude');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) aiProviders.push('Gemini');
  if (process.env.GAMMA_API_KEY) aiProviders.push('Gamma');

  integrations.push({
    name: 'AI Providers',
    configured: aiProviders.length > 0,
    status: aiProviders.length > 0 ? 'ready' : 'missing',
    message:
      aiProviders.length > 0
        ? `✅ ${aiProviders.join(', ')} configured`
        : '❌ No AI providers configured',
  });

  // Vector Database
  const hasPinecone = !!process.env.PINECONE_API_KEY;
  const hasUpstash = !!(
    process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
  );

  integrations.push({
    name: 'Vector Database',
    configured: hasPinecone || hasUpstash,
    status: hasPinecone || hasUpstash ? 'ready' : 'missing',
    message: hasPinecone
      ? '✅ Pinecone configured'
      : hasUpstash
        ? '✅ Upstash Vector configured'
        : '❌ No vector database configured',
  });

  // File Storage
  integrations.push({
    name: 'File Storage (Vercel Blob)',
    configured: !!process.env.BLOB_READ_WRITE_TOKEN,
    status: process.env.BLOB_READ_WRITE_TOKEN ? 'ready' : 'missing',
    message: process.env.BLOB_READ_WRITE_TOKEN
      ? '✅ Blob storage ready for uploads'
      : '❌ BLOB_READ_WRITE_TOKEN missing',
  });

  // Google OAuth
  integrations.push({
    name: 'Google OAuth (Gmail + Calendar)',
    configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    status: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? 'ready' : 'missing',
    message:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? '✅ Google OAuth ready'
        : '❌ Google OAuth credentials missing',
  });

  // Microsoft OAuth
  integrations.push({
    name: 'Microsoft OAuth (Outlook + Calendar)',
    configured: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    status:
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET ? 'ready' : 'missing',
    message:
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
        ? '✅ Microsoft OAuth ready'
        : '❌ Microsoft OAuth credentials missing',
  });

  // Google Custom Search
  integrations.push({
    name: 'Google Custom Search (Lead Intel)',
    configured: !!(
      process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
    ),
    status:
      process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
        ? 'ready'
        : 'missing',
    message:
      process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
        ? '✅ Web search available'
        : '❌ Google Custom Search not configured',
  });

  // Trigger.dev
  integrations.push({
    name: 'Background Jobs (Trigger.dev)',
    configured: !!process.env.TRIGGER_SECRET_KEY,
    status: process.env.TRIGGER_SECRET_KEY ? 'ready' : 'missing',
    message: process.env.TRIGGER_SECRET_KEY
      ? '✅ Background jobs enabled'
      : '⚠️  Background jobs disabled (optional)',
  });

  // Sentry
  integrations.push({
    name: 'Error Tracking (Sentry)',
    configured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    status: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'ready' : 'missing',
    message: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? '✅ Error tracking active'
      : '⚠️  Sentry not configured (optional)',
  });

  return integrations;
}

export function getBackendHealthScore(): {
  score: number;
  total: number;
  percentage: number;
  grade: string;
} {
  const integrations = checkBackendIntegrations();
  const total = integrations.length;
  const configured = integrations.filter((i) => i.configured).length;
  const percentage = Math.round((configured / total) * 100);

  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';

  return {
    score: configured,
    total,
    percentage,
    grade,
  };
}
