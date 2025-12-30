import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  blogReadingProgress,
  blogBookmarks,
  blogReactions,
  blogPosts
} from '@/db/schema';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Schema for reading progress update
const progressSchema = z.object({
  postId: z.string().uuid(),
  progressPercent: z.number().min(0).max(100),
});

// Schema for bookmark
const bookmarkSchema = z.object({
  postId: z.string().uuid(),
});

// Schema for reaction
const reactionSchema = z.object({
  postId: z.string().uuid(),
  type: z.enum(['helpful', 'insightful', 'inspiring']),
});

/**
 * GET - Get user's engagement data (reading progress, bookmarks)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Get blog engagement');
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'progress', 'bookmarks', 'continue'
    const postId = searchParams.get('postId');

    // Get specific post progress
    if (type === 'progress' && postId) {
      const progress = await db.query.blogReadingProgress.findFirst({
        where: and(
          eq(blogReadingProgress.userId, userId),
          eq(blogReadingProgress.postId, postId)
        ),
      });
      return NextResponse.json({ progress });
    }

    // Get all bookmarks
    if (type === 'bookmarks') {
      const bookmarks = await db
        .select({
          id: blogBookmarks.id,
          postId: blogBookmarks.postId,
          createdAt: blogBookmarks.createdAt,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          featuredImage: blogPosts.featuredImage,
          readingTimeMinutes: blogPosts.readingTimeMinutes,
        })
        .from(blogBookmarks)
        .leftJoin(blogPosts, eq(blogBookmarks.postId, blogPosts.id))
        .where(eq(blogBookmarks.userId, userId))
        .orderBy(desc(blogBookmarks.createdAt));

      return NextResponse.json({ bookmarks });
    }

    // Get "continue reading" (incomplete articles)
    if (type === 'continue') {
      const inProgress = await db
        .select({
          id: blogReadingProgress.id,
          postId: blogReadingProgress.postId,
          progressPercent: blogReadingProgress.progressPercent,
          lastReadAt: blogReadingProgress.lastReadAt,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          featuredImage: blogPosts.featuredImage,
          readingTimeMinutes: blogPosts.readingTimeMinutes,
        })
        .from(blogReadingProgress)
        .leftJoin(blogPosts, eq(blogReadingProgress.postId, blogPosts.id))
        .where(
          and(
            eq(blogReadingProgress.userId, userId),
            eq(blogReadingProgress.completed, false)
          )
        )
        .orderBy(desc(blogReadingProgress.lastReadAt))
        .limit(5);

      return NextResponse.json({ inProgress });
    }

    return createErrorResponse(new Error('Invalid type parameter'), 'Get blog engagement');
  } catch (error) {
    return createErrorResponse(error, 'Get blog engagement');
  }
}

/**
 * POST - Update engagement (progress, bookmark, reaction)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Update blog engagement');
    }

    const body = await request.json();
    const action = body.action; // 'progress', 'bookmark', 'reaction'

    // Update reading progress
    if (action === 'progress') {
      const validation = progressSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(new Error('Invalid progress data'), 'Update blog engagement');
      }

      const { postId, progressPercent } = validation.data;
      const completed = progressPercent >= 90;

      // Upsert progress
      const existing = await db.query.blogReadingProgress.findFirst({
        where: and(
          eq(blogReadingProgress.userId, userId),
          eq(blogReadingProgress.postId, postId)
        ),
      });

      if (existing) {
        await db
          .update(blogReadingProgress)
          .set({
            progressPercent,
            completed,
            lastReadAt: new Date(),
          })
          .where(eq(blogReadingProgress.id, existing.id));
      } else {
        await db.insert(blogReadingProgress).values({
          userId,
          postId,
          progressPercent,
          completed,
        });
      }

      return NextResponse.json({ success: true, completed });
    }

    // Toggle bookmark
    if (action === 'bookmark') {
      const validation = bookmarkSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(new Error('Invalid bookmark data'), 'Update blog engagement');
      }

      const { postId } = validation.data;

      // Check if already bookmarked
      const existing = await db.query.blogBookmarks.findFirst({
        where: and(
          eq(blogBookmarks.userId, userId),
          eq(blogBookmarks.postId, postId)
        ),
      });

      if (existing) {
        // Remove bookmark
        await db.delete(blogBookmarks).where(eq(blogBookmarks.id, existing.id));
        return NextResponse.json({ bookmarked: false });
      } else {
        // Add bookmark
        await db.insert(blogBookmarks).values({
          userId,
          postId,
        });
        return NextResponse.json({ bookmarked: true });
      }
    }

    // Add reaction
    if (action === 'reaction') {
      const validation = reactionSchema.safeParse(body);
      if (!validation.success) {
        return createErrorResponse(new Error('Invalid reaction data'), 'Update blog engagement');
      }

      const { postId, type } = validation.data;

      // Check if already reacted
      const existing = await db.query.blogReactions.findFirst({
        where: and(
          eq(blogReactions.userId, userId),
          eq(blogReactions.postId, postId)
        ),
      });

      if (existing) {
        // Update reaction type
        await db
          .update(blogReactions)
          .set({ type })
          .where(eq(blogReactions.id, existing.id));
      } else {
        await db.insert(blogReactions).values({
          userId,
          postId,
          type,
        });
      }

      return NextResponse.json({ reacted: true, type });
    }

    return createErrorResponse(new Error('Invalid action'), 'Update blog engagement');
  } catch (error) {
    return createErrorResponse(error, 'Update blog engagement');
  }
}

/**
 * DELETE - Remove bookmark
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Delete blog bookmark');
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return createErrorResponse(new Error('postId is required'), 'Delete blog bookmark');
    }

    await db.delete(blogBookmarks).where(
      and(
        eq(blogBookmarks.userId, userId),
        eq(blogBookmarks.postId, postId)
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete blog bookmark');
  }
}
