import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts, users, topicIdeas } from '@/db/schema';
import { isSystemAdmin } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for creating/updating posts
const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  featuredImage: z.string().nullable().optional(),
  readingTimeMinutes: z.number().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  // Hit List integration - link to topic idea
  topicId: z.string().uuid().nullable().optional(),
});

// GET - List all posts (admin only)
export async function GET() {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const posts = await db.query.blogPosts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
      with: {
        category: true,
        author: true,
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    logger.error('Failed to fetch posts', { error });
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create new post (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get current user for author
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Get user's database ID
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.id),
    });

    const body = await request.json();
    const validationResult = postSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if slug already exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, data.slug),
    });

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Create the post
    const [newPost] = await db
      .insert(blogPosts)
      .values({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content || '',
        categoryId: data.categoryId || null,
        authorId: dbUser?.id || null,
        status: data.status,
        featured: data.featured,
        featuredImage: data.featuredImage || null,
        readingTimeMinutes: data.readingTimeMinutes || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      })
      .returning();

    // If linked to a Hit List topic, update the topic with the resulting post ID
    if (data.topicId) {
      try {
        await db
          .update(topicIdeas)
          .set({
            resultingPostId: newPost.id,
            status: 'in_progress',
            wizardProgress: {
              currentStep: 'writing_started',
              completedSteps: ['topic_selected', 'outline_created', 'writing_started'],
              percentage: 50,
              startedAt: new Date().toISOString(),
              lastUpdatedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
          })
          .where(eq(topicIdeas.id, data.topicId));

        logger.info('Hit List topic linked to post', { 
          topicId: data.topicId, 
          postId: newPost.id 
        });
      } catch (linkError) {
        // Log but don't fail - the post was created successfully
        logger.error('Failed to link topic to post', { 
          error: linkError, 
          topicId: data.topicId, 
          postId: newPost.id 
        });
      }
    }

    logger.info('Blog post created', { postId: newPost.id, title: newPost.title });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    logger.error('Failed to create post', { error });
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
