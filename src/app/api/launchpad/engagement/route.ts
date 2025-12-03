import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { 
  blogReadingProgress, 
  blogBookmarks, 
  blogReactions,
  blogPosts 
} from '@/db/schema';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Failed to get engagement data:', error);
    return NextResponse.json(
      { error: 'Failed to get engagement data' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update engagement (progress, bookmark, reaction)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action; // 'progress', 'bookmark', 'reaction'

    // Update reading progress
    if (action === 'progress') {
      const validation = progressSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid data', details: validation.error.errors },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: 'Invalid data', details: validation.error.errors },
          { status: 400 }
        );
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
        return NextResponse.json(
          { error: 'Invalid data', details: validation.error.errors },
          { status: 400 }
        );
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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update engagement:', error);
    return NextResponse.json(
      { error: 'Failed to update engagement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove bookmark
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 });
    }

    await db.delete(blogBookmarks).where(
      and(
        eq(blogBookmarks.userId, userId),
        eq(blogBookmarks.postId, postId)
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
