import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceApiKeys, users } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { encryptApiKey } from '@/lib/encryption';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'google', 'custom']).default('custom'),
});

// ============================================================================
// GET - List API Keys
// ============================================================================

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all API keys for workspace
    const apiKeys = await db.query.workspaceApiKeys.findMany({
      where: eq(workspaceApiKeys.workspaceId, workspaceId),
      orderBy: [workspaceApiKeys.createdAt],
    });

    // Get user details for createdBy (if any keys exist)
    let creatorMap = new Map<string, { email: string; firstName: string | null; lastName: string | null }>();
    if (apiKeys.length > 0) {
      const userIds = [...new Set(apiKeys.map((k) => k.createdBy))];
      const creators = await db.query.users.findMany({
        where: inArray(users.id, userIds),
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });
      creatorMap = new Map(creators.map((u) => [u.id, u]));
    }

    return NextResponse.json({
      apiKeys: apiKeys.map((key) => {
        const creator = creatorMap.get(key.createdBy);
        return {
          id: key.id,
          name: key.name,
          provider: key.provider,
          key: `${key.provider}_****${key.encryptedKey.slice(-4)}`, // Masked key
          created: key.createdAt.toISOString().split('T')[0],
          lastUsed: key.lastUsedAt
            ? new Date(key.lastUsedAt).toLocaleDateString()
            : 'Never',
          lastUsedAt: key.lastUsedAt,
          createdAt: key.createdAt,
          createdBy: creator?.email || 'Unknown',
        };
      }),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get API keys error');
  }
}

// ============================================================================
// POST - Create API Key
// ============================================================================

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();
    const body = await request.json();
    
    // Validate input
    const validationResult = createApiKeySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, key, provider } = validationResult.data;

    // Get current user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, currentUser.clerkUserId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if API key already exists for this provider
    const existingKey = await db.query.workspaceApiKeys.findFirst({
      where: and(
        eq(workspaceApiKeys.workspaceId, workspaceId),
        eq(workspaceApiKeys.provider, provider)
      ),
    });

    if (existingKey) {
      return NextResponse.json(
        { error: `API key for ${provider} already exists. Delete the existing one first.` },
        { status: 409 }
      );
    }

    // Encrypt the API key
    const encrypted = encryptApiKey(key);

    // Create API key record
    const [newApiKey] = await db
      .insert(workspaceApiKeys)
      .values({
        workspaceId,
        provider,
        name,
        encryptedKey: encrypted.encryptedKey,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        createdBy: userRecord.id,
        isActive: true,
      })
      .returning();

    logger.info('API key created', { apiKeyId: newApiKey.id, provider, workspaceId });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        provider: newApiKey.provider,
        key: `${provider}_****${encrypted.encryptedKey.slice(-4)}`, // Masked
        createdAt: newApiKey.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create API key error');
  }
}

