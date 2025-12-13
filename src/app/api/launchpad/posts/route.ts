import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { logger } from '@/lib/logger';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Public API for Launchpad posts
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where conditions
    const conditions = [eq(blogPosts.status, 'published')];

    if (category) {
      const cat = await db.query.blogCategories.findFirst({
        where: eq(blogCategories.slug, category),
      });
      if (cat) {
        conditions.push(eq(blogPosts.categoryId, cat.id));
      }
    }

    // Execute query
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        featured: blogPosts.featured,
        viewCount: blogPosts.viewCount,
        categoryId: blogPosts.categoryId,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        categoryColor: blogCategories.color,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);

    // Filter by search if provided (simple title/excerpt search)
    let filteredPosts = posts;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = posts.filter(
        p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.excerpt?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      posts: filteredPosts,
      meta: {
        limit,
        offset,
        count: filteredPosts.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch launchpad posts', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
