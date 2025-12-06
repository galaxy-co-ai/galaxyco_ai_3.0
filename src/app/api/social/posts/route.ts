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
import { logger } from '@/lib/logger';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = createPostSchema.parse(body);

    // Check if platform is connected
    if (validated.platform === 'twitter') {
      const twitterIntegration = await getTwitterIntegration(workspace.workspaceId);
      if (!twitterIntegration) {
        return NextResponse.json(
          { error: 'Twitter account not connected. Please connect in Connected Apps.' },
          { status: 400 }
        );
      }

      // If scheduled, save to database
      if (validated.scheduleFor) {
        const scheduledDate = new Date(validated.scheduleFor);
        if (scheduledDate <= new Date()) {
          return NextResponse.json(
            { error: 'Scheduled time must be in the future' },
            { status: 400 }
          );
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
        return NextResponse.json(
          { error: result.error || 'Failed to post to Twitter' },
          { status: 500 }
        );
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

    return NextResponse.json(
      { error: 'Unsupported platform' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` },
        { status: 400 }
      );
    }

    logger.error('Failed to create social media post', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: List Social Media Posts
// ============================================================================

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await getCurrentWorkspace();
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
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
    logger.error('Failed to list social media posts', error);
    return NextResponse.json(
      { error: 'Failed to list posts' },
      { status: 500 }
    );
  }
}
