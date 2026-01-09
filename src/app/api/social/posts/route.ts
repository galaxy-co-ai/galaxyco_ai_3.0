/**
 * Social Media Posts API
 * 
 * POST: Create and post social media content
 * GET: List posts with engagement metrics
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { socialMediaPosts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';
import { postTweet, getTwitterIntegration } from '@/lib/social/twitter';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const createPostSchema = z.object({
  platform: z.enum(['twitter']),
  content: z.string().min(1).max(280),
  mediaUrls: z.array(z.string().url()).optional().default([]),
  scheduleFor: z.string().datetime().optional(),
});

// ============================================================================
// POST: Create and Post Social Media Content
// ============================================================================

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(new Error('Unauthorized'), 'Create social post');
    }

    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return createErrorResponse(new Error('Workspace not found'), 'Create social post');
    }

    const body = await request.json().catch(() => ({}));
    const validated = createPostSchema.parse(body);

    // Check if platform is connected
    if (validated.platform === 'twitter') {
      const twitterIntegration = await getTwitterIntegration(workspace.workspaceId);
      if (!twitterIntegration) {
        return createErrorResponse(new Error('Twitter account not connected - invalid request'), 'Create social post');
      }

      // If scheduled, save to database
      if (validated.scheduleFor) {
        const scheduledDate = new Date(validated.scheduleFor);
        if (scheduledDate <= new Date()) {
          return createErrorResponse(new Error('Scheduled time must be in the future - invalid request'), 'Create social post');
        }

        const [post] = await db
          .insert(socialMediaPosts)
          .values({
            workspaceId: workspace.workspaceId,
            integrationId: twitterIntegration.id,
            userId: user.id,
            platform: 'twitter',
            content: validated.content,
            mediaUrls: validated.mediaUrls,
            status: 'scheduled',
            scheduledFor: scheduledDate,
          })
          .returning();

        return NextResponse.json({
          success: true,
          post: {
            id: post.id,
            platform: post.platform,
            content: post.content,
            status: post.status,
            scheduledFor: post.scheduledFor,
          },
        });
      }

      // Post immediately
      const result = await postTweet(twitterIntegration.id, validated.content);

      if (!result.success) {
        return createErrorResponse(new Error(result.error || 'Failed to post to Twitter'), 'Create social post');
      }

      // Save to database
      const [post] = await db
        .insert(socialMediaPosts)
        .values({
          workspaceId: workspace.workspaceId,
          integrationId: twitterIntegration.id,
          userId: user.id,
          platform: 'twitter',
          content: validated.content,
          mediaUrls: validated.mediaUrls,
          status: 'posted',
          postedAt: new Date(),
          externalPostId: result.tweetId,
        })
        .returning();

      return NextResponse.json({
        success: true,
        post: {
          id: post.id,
          platform: post.platform,
          content: post.content,
          status: post.status,
          url: result.url,
          tweetId: result.tweetId,
        },
      });
    }

    return createErrorResponse(new Error('Unsupported platform - invalid request'), 'Create social post');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`), 'Create social post');
    }

    return createErrorResponse(error, 'Create social post');
  }
}

// ============================================================================
// GET: List Social Media Posts
// ============================================================================

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse(new Error('Unauthorized'), 'List social posts');
    }

    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return createErrorResponse(new Error('Workspace not found'), 'List social posts');
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereConditions = [eq(socialMediaPosts.workspaceId, workspace.workspaceId)];
    
    if (platform) {
      whereConditions.push(eq(socialMediaPosts.platform, platform));
    }

    const posts = await db.query.socialMediaPosts.findMany({
      where: and(...whereConditions),
      orderBy: [desc(socialMediaPosts.createdAt)],
      limit: Math.min(limit, 100),
    });

    return NextResponse.json({
      success: true,
      posts: posts.map((post) => ({
        id: post.id,
        platform: post.platform,
        content: post.content,
        status: post.status,
        postedAt: post.postedAt,
        scheduledFor: post.scheduledFor,
        externalPostId: post.externalPostId,
        engagement: post.engagement,
        createdAt: post.createdAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'List social posts');
  }
}
