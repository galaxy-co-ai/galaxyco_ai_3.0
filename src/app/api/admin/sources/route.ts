import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { articleSources, blogPosts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Create source schema
const createSourceSchema = z.object({
  postId: z.string().uuid(),
  title: z.string().min(1).max(500),
  url: z.string().url().nullable().optional(),
  publication: z.string().max(200).nullable().optional(),
  publishedDate: z.string().nullable().optional(),
  quoteUsed: z.string().max(2000).nullable().optional(),
  claimSupported: z.string().max(2000).nullable().optional(),
  verified: z.boolean().optional().default(false),
  verificationStatus: z.enum(['verified', 'unverified', 'failed']).optional().default('unverified'),
  verificationMethod: z.string().max(100).nullable().optional(),
  verificationNotes: z.string().max(1000).nullable().optional(),
  inlinePosition: z.number().int().nullable().optional(),
});

/**
 * GET /api/admin/sources
 * List sources for a post
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Get sources auth');
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return createErrorResponse(new Error('Invalid request: postId required'), 'Get sources validation');
    }

    // Verify user has access to this post
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, postId),
    });

    if (!post) {
      return createErrorResponse(new Error('Post not found'), 'Get sources post');
    }

    // Fetch sources
    const sources = await db.query.articleSources.findMany({
      where: eq(articleSources.postId, postId),
      orderBy: [desc(articleSources.createdAt)],
    });

    return NextResponse.json({ sources });
  } catch (error) {
    return createErrorResponse(error, 'Get sources error');
  }
}

/**
 * POST /api/admin/sources
 * Create a new source
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Create source auth');
    }

    const body = await request.json();
    const validation = createSourceSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Invalid request: validation failed'), 'Create source validation');
    }

    const data = validation.data;

    // Verify user has access to this post
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, data.postId),
    });

    if (!post) {
      return createErrorResponse(new Error('Post not found'), 'Create source post');
    }

    // Create source
    const [source] = await db.insert(articleSources).values({
      postId: data.postId,
      title: data.title,
      url: data.url || null,
      publication: data.publication || null,
      publishedDate: data.publishedDate ? new Date(data.publishedDate) : null,
      quoteUsed: data.quoteUsed || null,
      claimSupported: data.claimSupported || null,
      verified: data.verified,
      verificationStatus: data.verificationStatus,
      verificationMethod: data.verificationMethod || null,
      verificationNotes: data.verificationNotes || null,
      verifiedAt: data.verified ? new Date() : null,
      inlinePosition: data.inlinePosition || null,
    }).returning();

    logger.info('Source created', { sourceId: source.id, postId: data.postId });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create source error');
  }
}

