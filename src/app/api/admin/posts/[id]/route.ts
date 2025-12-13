import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts, topicIdeas, alertBadges } from '@/db/schema';
import { isSystemAdmin } from '@/lib/auth';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Auto-complete Hit List item when associated post is published.
 * Creates a success alert badge for the user.
 */
async function completeHitListItem(postId: string, postTitle: string) {
  try {
    // Find any topic idea linked to this post
    const [linkedTopic] = await db
      .select({
        id: topicIdeas.id,
        workspaceId: topicIdeas.workspaceId,
        title: topicIdeas.title,
      })
      .from(topicIdeas)
      .where(eq(topicIdeas.resultingPostId, postId))
      .limit(1);

    if (!linkedTopic) {
      // No linked topic - nothing to complete
      return;
    }

    // Update the topic idea to published status
    await db
      .update(topicIdeas)
      .set({
        status: 'published',
        wizardProgress: {
          currentStep: 'published',
          completedSteps: [
            'topic_selected',
            'brainstorm_started',
            'outline_created',
            'writing_started',
            'first_draft_complete',
            'editing',
            'ready_to_publish',
            'published',
          ],
          percentage: 100,
          lastUpdatedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(topicIdeas.id, linkedTopic.id));

    // Create milestone alert badge for successful publication
    await db.insert(alertBadges).values({
      workspaceId: linkedTopic.workspaceId,
      type: 'milestone',
      title: 'Article Published from Hit List!',
      message: `"${postTitle}" has been published successfully.`,
      priority: 10, // Higher priority for milestones
      actionUrl: `/admin/content/${postId}`,
      actionLabel: 'View Article',
      relatedEntityType: 'post',
      relatedEntityId: postId,
    });

    logger.info('Hit List item auto-completed on publish', {
      topicId: linkedTopic.id,
      postId,
      postTitle,
    });
  } catch (error) {
    // Log but don't fail the publish operation
    logger.error('Failed to auto-complete Hit List item', {
      error,
      postId,
    });
  }
}

// Validation schema for updating posts
const updatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).optional(),
  featured: z.boolean().optional(),
  featuredImage: z.string().nullable().optional(),
  readingTimeMinutes: z.number().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single post (admin only)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: {
        category: true,
        author: true,
        postTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    logger.error('Failed to fetch post', { error });
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT - Update post (admin only)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if post exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if slug already exists (for another post)
    if (data.slug && data.slug !== existingPost.slug) {
      const slugExists = await db.query.blogPosts.findFirst({
        where: and(
          eq(blogPosts.slug, data.slug),
          ne(blogPosts.id, id)
        ),
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.readingTimeMinutes !== undefined) updateData.readingTimeMinutes = data.readingTimeMinutes;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    // Update the post
    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    logger.info('Blog post updated', { postId: id, updates: Object.keys(updateData) });

    // Auto-complete Hit List item when post is published
    if (data.status === 'published' && existingPost.status !== 'published') {
      await completeHitListItem(id, updatedPost.title);
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    logger.error('Failed to update post', { error });
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete post (admin only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if post exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Delete the post
    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    logger.info('Blog post deleted', { postId: id, title: existingPost.title });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete post', { error });
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
