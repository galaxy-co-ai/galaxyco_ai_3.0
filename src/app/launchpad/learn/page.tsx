import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { eq, desc, and, inArray, gte } from 'drizzle-orm';
import { Clock, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { NewsletterSignup } from '@/components/launchpad/NewsletterSignup';
import { LaunchpadHero } from '@/components/launchpad/LaunchpadHero';
import { LaunchpadSidebar } from '@/components/launchpad/LaunchpadSidebar';

export const metadata: Metadata = {
  title: 'Learn | Launchpad | GalaxyCo.ai',
  description: 'Tutorials, guides, and best practices for using AI in your business.',
  openGraph: {
    title: 'Learn | Launchpad | GalaxyCo.ai',
    description: 'Tutorials, guides, and best practices for using AI in your business',
    type: 'website',
  },
};

// Learn-focused categories
const LEARN_CATEGORIES = [
  'getting-started',
  'tutorials',
  'best-practices',
  'use-cases',
  'case-studies',
];

// Get categories
async function getCategories() {
  try {
    return await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description,
        color: blogCategories.color,
      })
      .from(blogCategories)
      .where(eq(blogCategories.isActive, true))
      .orderBy(blogCategories.sortOrder);
  } catch {
    return [];
  }
}

// Get posts for learn categories
async function getLearnPosts() {
  try {
    const categories = await getCategories();
    const learnCategoryIds = categories
      .filter(cat => LEARN_CATEGORIES.includes(cat.slug))
      .map(cat => cat.id);

    if (learnCategoryIds.length === 0) {
      return [];
    }

    return await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        featured: blogPosts.featured,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        categoryColor: blogCategories.color,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(
        and(
          eq(blogPosts.status, 'published'),
          inArray(blogPosts.categoryId, learnCategoryIds)
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(20);
  } catch {
    return [];
  }
}

// Get trending posts
async function getTrendingPosts() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        viewCount: blogPosts.viewCount,
        categoryName: blogCategories.name,
        categoryColor: blogCategories.color,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(
        and(
          eq(blogPosts.status, 'published'),
          gte(blogPosts.publishedAt, sevenDaysAgo)
        )
      )
      .orderBy(desc(blogPosts.viewCount))
      .limit(5);
  } catch {
    return [];
  }
}

function PostCard({ post }: { 
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    readingTimeMinutes: number | null;
    publishedAt: Date | null;
    featured?: boolean;
    categoryName: string | null;
    categorySlug: string | null;
    categoryColor: string | null;
  };
}) {
  const cardContent = (
    <Card className="h-full transition-all duration-200 group overflow-hidden relative hover:shadow-soft-hover hover:border-primary/20 cursor-pointer">
      {post.featuredImage ? (
        <div className="aspect-[16/10] overflow-hidden bg-muted">
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/25" />
        </div>
      )}
      <CardHeader className="space-y-2.5 pb-2">
        {post.categoryName && (
          <Badge 
            variant="secondary" 
            className="w-fit text-xs font-medium"
            style={{ 
              backgroundColor: post.categoryColor ? `${post.categoryColor}12` : undefined,
              color: post.categoryColor || undefined,
            }}
          >
            {post.categoryName}
          </Badge>
        )}
        <CardTitle className="text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {post.excerpt && (
          <CardDescription className="line-clamp-2 mb-4 text-sm leading-relaxed">
            {post.excerpt}
          </CardDescription>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.readingTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingTimeMinutes} min
            </span>
          )}
          {post.publishedAt && (
            <span>
              {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Link href={`/launchpad/${post.slug}`}>
      {cardContent}
    </Link>
  );
}

export default async function LearnPage() {
  const [posts, categories, trending] = await Promise.all([
    getLearnPosts(),
    getCategories(),
    getTrendingPosts(),
  ]);

  const hasContent = posts.length > 0;
  const displayCategories = categories.filter(cat => LEARN_CATEGORIES.includes(cat.slug));
  const displayTrending = trending.length > 0 ? trending : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Tab Nav */}
      <LaunchpadHero 
        categories={categories} 
        hasContent={hasContent} 
      />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <GraduationCap className="h-5 w-5 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold">Learn</h1>
          </div>
          <p className="text-muted-foreground">
            Step-by-step tutorials, guides, and best practices to help you master AI for your business.
          </p>
        </div>

        {/* Category Filter Chips */}
        {displayCategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {displayCategories.map((category) => (
              <Link
                key={category.id}
                href={`/launchpad/category/${category.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all hover:bg-muted/50 hover:border-primary/20"
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color || undefined }}
                />
                <span className="text-sm font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Articles Grid - 2 columns */}
          <section className="lg:col-span-2">
            {hasContent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">All Articles</h2>
                  {posts.length > 6 && (
                    <Link href="/launchpad" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                      View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold mb-2">No tutorials yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Check back soon for step-by-step guides and tutorials.
                </p>
                <Link href="/launchpad">
                  <Badge variant="outline" className="px-4 py-2">
                    Browse All Articles
                  </Badge>
                </Link>
              </div>
            )}
          </section>

          {/* Sidebar */}
          <LaunchpadSidebar 
            trending={displayTrending}
            categories={categories}
            hasContent={hasContent}
          />
        </div>

        {/* Newsletter CTA */}
        <div className="mt-14">
          <NewsletterSignup variant="card" />
        </div>
      </div>
    </div>
  );
}

