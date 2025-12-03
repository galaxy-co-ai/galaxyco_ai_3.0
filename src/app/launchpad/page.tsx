import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { Clock, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = {
  title: 'Launchpad | GalaxyCo.ai',
  description: 'Practical AI guidance for small business owners. Learn how to use AI to grow your business without the complexity.',
  openGraph: {
    title: 'Launchpad | GalaxyCo.ai',
    description: 'Practical AI guidance for small business owners',
    type: 'website',
  },
};

// Get published posts
async function getPublishedPosts() {
  try {
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
        viewCount: blogPosts.viewCount,
        categoryId: blogPosts.categoryId,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        categoryColor: blogCategories.color,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(20);
  } catch {
    return [];
  }
}

// Get categories with post counts
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

// Get trending posts (most views in last 7 days)
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

function PostCard({ post }: { post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  readingTimeMinutes: number | null;
  publishedAt: Date | null;
  featured: boolean;
  categoryName: string | null;
  categorySlug: string | null;
  categoryColor: string | null;
}}) {
  return (
    <Link href={`/launchpad/${post.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all hover:border-primary/20 group overflow-hidden">
        {post.featuredImage && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={post.featuredImage} 
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          {post.categoryName && (
            <Badge 
              variant="secondary" 
              className="w-fit text-xs"
              style={{ 
                backgroundColor: post.categoryColor ? `${post.categoryColor}20` : undefined,
                color: post.categoryColor || undefined,
              }}
            >
              {post.categoryName}
            </Badge>
          )}
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {post.excerpt && (
            <CardDescription className="line-clamp-2 mb-3">
              {post.excerpt}
            </CardDescription>
          )}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {post.readingTimeMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTimeMinutes} min read
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
    </Link>
  );
}

export default async function LaunchpadHomePage() {
  const [posts, categories, trending] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTrendingPosts(),
  ]);

  const featuredPosts = posts.filter(p => p.featured).slice(0, 2);
  const regularPosts = posts.filter(p => !p.featured);

  return (
    <div className="container py-8">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          AI Made Simple for Business Owners
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Practical guidance to help you use AI for real business results — 
          no technical background required.
        </p>
      </section>

      {/* Category Pills */}
      {categories.length > 0 && (
        <section className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/launchpad">
              <Button variant="secondary" size="sm" className="rounded-full">
                All
              </Button>
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/launchpad/category/${category.slug}`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full"
                  style={{
                    borderColor: category.color ? `${category.color}40` : undefined,
                  }}
                >
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Featured</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Trending This Week */}
      {trending.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Trending This Week</h2>
          </div>
          <Card>
            <CardContent className="py-4">
              <div className="space-y-3">
                {trending.map((post, index) => (
                  <Link 
                    key={post.id} 
                    href={`/launchpad/${post.slug}`}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-2xl font-bold text-muted-foreground/50 w-8">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{post.title}</p>
                      {post.categoryName && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs mt-1"
                          style={{ 
                            backgroundColor: post.categoryColor ? `${post.categoryColor}20` : undefined,
                            color: post.categoryColor || undefined,
                          }}
                        >
                          {post.categoryName}
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* All Posts */}
      {regularPosts.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold mb-6">Latest Articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : posts.length === 0 ? (
        <section className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We&apos;re preparing helpful content to help you succeed with AI. 
            Check back soon!
          </p>
        </section>
      ) : null}

      {/* Newsletter CTA */}
      <section className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border text-center">
        <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Get practical AI tips delivered to your inbox. No spam, just value.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input 
            type="email" 
            placeholder="Enter your email"
            className="flex-1 px-4 py-2 rounded-lg border bg-background"
          />
          <Button>Subscribe</Button>
        </div>
      </section>
    </div>
  );
}
