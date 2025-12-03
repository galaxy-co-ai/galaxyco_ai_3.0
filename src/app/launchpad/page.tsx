import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { Clock, ArrowRight, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { NewsletterSignup } from '@/components/launchpad/NewsletterSignup';

export const metadata: Metadata = {
  title: 'Launchpad | GalaxyCo.ai',
  description: 'Practical AI guidance for small business owners. Learn how to use AI to grow your business without the complexity.',
  openGraph: {
    title: 'Launchpad | GalaxyCo.ai',
    description: 'Practical AI guidance for small business owners',
    type: 'website',
  },
};

// Demo categories for skeleton view
const DEMO_CATEGORIES = [
  { id: '1', name: 'Getting Started', slug: 'getting-started', color: '#6366f1', description: 'Your first steps with AI' },
  { id: '2', name: 'Tutorials', slug: 'tutorials', color: '#8b5cf6', description: 'Step-by-step guides' },
  { id: '3', name: 'Use Cases', slug: 'use-cases', color: '#06b6d4', description: 'Real-world applications' },
  { id: '4', name: 'Industry News', slug: 'industry-news', color: '#10b981', description: 'Latest AI developments' },
  { id: '5', name: 'Best Practices', slug: 'best-practices', color: '#f59e0b', description: 'Tips from experts' },
  { id: '6', name: 'Case Studies', slug: 'case-studies', color: '#ec4899', description: 'Success stories' },
];

// Demo posts for skeleton view
const DEMO_FEATURED_POSTS = [
  {
    id: 'demo-1',
    title: '5 Ways AI Can Transform Your Small Business in 2024',
    slug: '#',
    excerpt: 'Discover practical AI applications that are accessible to businesses of any size. No technical expertise required.',
    featuredImage: null,
    readingTimeMinutes: 8,
    publishedAt: new Date(),
    featured: true,
    categoryName: 'Getting Started',
    categorySlug: 'getting-started',
    categoryColor: '#6366f1',
  },
  {
    id: 'demo-2',
    title: 'The Complete Guide to AI-Powered Customer Service',
    slug: '#',
    excerpt: 'Learn how to implement AI chatbots and automated responses that actually help your customers.',
    featuredImage: null,
    readingTimeMinutes: 12,
    publishedAt: new Date(Date.now() - 86400000),
    featured: true,
    categoryName: 'Tutorials',
    categorySlug: 'tutorials',
    categoryColor: '#8b5cf6',
  },
];

const DEMO_TRENDING = [
  { id: 't1', title: 'How to Write Better Prompts: A Beginner\'s Guide', slug: '#', categoryName: 'Tutorials', categoryColor: '#8b5cf6', viewCount: 1234 },
  { id: 't2', title: 'OpenAI vs Claude vs Gemini: Which is Right for Your Business?', slug: '#', categoryName: 'Industry News', categoryColor: '#10b981', viewCount: 987 },
  { id: 't3', title: 'Automating Your Email Marketing with AI', slug: '#', categoryName: 'Use Cases', categoryColor: '#06b6d4', viewCount: 856 },
  { id: 't4', title: 'AI Security Best Practices for Small Businesses', slug: '#', categoryName: 'Best Practices', categoryColor: '#f59e0b', viewCount: 743 },
  { id: 't5', title: 'How a Local Bakery Increased Sales 40% with AI', slug: '#', categoryName: 'Case Studies', categoryColor: '#ec4899', viewCount: 621 },
];

const DEMO_POSTS = [
  {
    id: 'p1',
    title: 'Getting Started with ChatGPT for Business',
    slug: '#',
    excerpt: 'A practical introduction to using ChatGPT for everyday business tasks.',
    featuredImage: null,
    readingTimeMinutes: 6,
    publishedAt: new Date(Date.now() - 172800000),
    featured: false,
    categoryName: 'Getting Started',
    categorySlug: 'getting-started',
    categoryColor: '#6366f1',
  },
  {
    id: 'p2',
    title: 'Creating Social Media Content with AI Tools',
    slug: '#',
    excerpt: 'Save hours every week by automating your social media content creation.',
    featuredImage: null,
    readingTimeMinutes: 7,
    publishedAt: new Date(Date.now() - 259200000),
    featured: false,
    categoryName: 'Tutorials',
    categorySlug: 'tutorials',
    categoryColor: '#8b5cf6',
  },
  {
    id: 'p3',
    title: 'AI Tools for Financial Planning and Forecasting',
    slug: '#',
    excerpt: 'Leverage AI to make better financial decisions for your business.',
    featuredImage: null,
    readingTimeMinutes: 9,
    publishedAt: new Date(Date.now() - 345600000),
    featured: false,
    categoryName: 'Use Cases',
    categorySlug: 'use-cases',
    categoryColor: '#06b6d4',
  },
  {
    id: 'p4',
    title: 'The Latest in AI: What\'s New This Month',
    slug: '#',
    excerpt: 'A roundup of the most important AI developments affecting small businesses.',
    featuredImage: null,
    readingTimeMinutes: 5,
    publishedAt: new Date(Date.now() - 432000000),
    featured: false,
    categoryName: 'Industry News',
    categorySlug: 'industry-news',
    categoryColor: '#10b981',
  },
  {
    id: 'p5',
    title: 'Building Trust with AI-Generated Content',
    slug: '#',
    excerpt: 'Best practices for using AI while maintaining authenticity with your audience.',
    featuredImage: null,
    readingTimeMinutes: 8,
    publishedAt: new Date(Date.now() - 518400000),
    featured: false,
    categoryName: 'Best Practices',
    categorySlug: 'best-practices',
    categoryColor: '#f59e0b',
  },
  {
    id: 'p6',
    title: 'From Skeptic to Advocate: A Restaurant Owner\'s AI Journey',
    slug: '#',
    excerpt: 'How one restaurant owner went from AI skeptic to saving 15 hours per week.',
    featuredImage: null,
    readingTimeMinutes: 10,
    publishedAt: new Date(Date.now() - 604800000),
    featured: false,
    categoryName: 'Case Studies',
    categorySlug: 'case-studies',
    categoryColor: '#ec4899',
  },
];

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

function PostCard({ post, isDemo = false }: { 
  post: {
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
  };
  isDemo?: boolean;
}) {
  const cardContent = (
    <Card className={`h-full transition-all group overflow-hidden relative ${
      isDemo 
        ? 'opacity-80 border-dashed' 
        : 'hover:shadow-lg hover:border-primary/20 cursor-pointer'
    }`}>
      {post.featuredImage ? (
        <div className="aspect-video overflow-hidden bg-muted">
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}
      <CardHeader className="space-y-2 pb-2">
        {post.categoryName && (
          <Badge 
            variant="secondary" 
            className="w-fit text-xs font-medium"
            style={{ 
              backgroundColor: post.categoryColor ? `${post.categoryColor}15` : undefined,
              color: post.categoryColor || undefined,
              borderColor: post.categoryColor ? `${post.categoryColor}30` : undefined,
            }}
          >
            {post.categoryName}
          </Badge>
        )}
        <CardTitle className={`text-lg leading-tight line-clamp-2 ${!isDemo && 'group-hover:text-primary'} transition-colors`}>
          {post.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {post.excerpt && (
          <CardDescription className="line-clamp-2 mb-4 text-sm">
            {post.excerpt}
          </CardDescription>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.readingTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
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
      {isDemo && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs">Demo Content</Badge>
        </div>
      )}
    </Card>
  );

  if (isDemo) {
    return <div className="block">{cardContent}</div>;
  }

  return (
    <Link href={`/launchpad/${post.slug}`}>
      {cardContent}
    </Link>
  );
}

export default async function LaunchpadHomePage() {
  const [posts, categories, trending] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTrendingPosts(),
  ]);

  // Use real content if available, otherwise show demo
  const hasContent = posts.length > 0;
  const displayCategories = categories.length > 0 ? categories : DEMO_CATEGORIES;
  const displayFeatured = hasContent ? posts.filter(p => p.featured).slice(0, 2) : DEMO_FEATURED_POSTS;
  const displayTrending = trending.length > 0 ? trending : DEMO_TRENDING;
  const displayPosts = hasContent ? posts.filter(p => !p.featured) : DEMO_POSTS;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              AI Made Simple for Business Owners
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Practical guidance to help you use AI for real business results — 
              no technical background required.
            </p>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="border-b bg-background/95 backdrop-blur sticky top-14 z-40">
        <div className="container py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Link href="/launchpad">
              <Button variant="secondary" size="sm" className="rounded-full shrink-0 font-medium">
                All Topics
              </Button>
            </Link>
            {displayCategories.map((category) => (
              <Link key={category.id} href={hasContent ? `/launchpad/category/${category.slug}` : '#'}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full shrink-0 hover:bg-muted"
                >
                  {category.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-10">
        {/* Demo Banner */}
        {!hasContent && (
          <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <Sparkles className="inline h-4 w-4 mr-1" />
              <strong>Preview Mode:</strong> This is demo content showing the Launchpad layout. 
              Create your first post in Mission Control to see real content here.
            </p>
          </div>
        )}

        {/* Featured Posts */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold">Featured</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {displayFeatured.map((post) => (
              <PostCard key={post.id} post={post} isDemo={!hasContent} />
            ))}
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid gap-10 lg:grid-cols-3 mb-14">
          {/* Latest Articles - 2 columns */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Latest Articles</h2>
              {hasContent && posts.length > 6 && (
                <Button variant="ghost" size="sm" className="text-primary">
                  View all <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {displayPosts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} isDemo={!hasContent} />
              ))}
            </div>
          </section>

          {/* Sidebar - 1 column */}
          <aside className="space-y-8">
            {/* Trending This Week */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold">Trending</h3>
              </div>
              <Card>
                <CardContent className="py-3 px-0">
                  <div className="space-y-1">
                    {displayTrending.map((post, index) => (
                      <Link 
                        key={post.id} 
                        href={hasContent ? `/launchpad/${post.slug}` : '#'}
                        className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                          hasContent ? 'hover:bg-muted' : 'cursor-default opacity-75'
                        }`}
                      >
                        <span className="text-lg font-bold text-muted-foreground/40 w-5 shrink-0 tabular-nums">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug line-clamp-2">
                            {post.title}
                          </p>
                          {post.categoryName && (
                            <span 
                              className="text-xs mt-1 inline-block"
                              style={{ color: post.categoryColor || undefined }}
                            >
                              {post.categoryName}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Browse by Topic */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Browse by Topic</h3>
              <div className="space-y-2">
                {displayCategories.slice(0, 6).map((category) => (
                  <Link 
                    key={category.id} 
                    href={hasContent ? `/launchpad/category/${category.slug}` : '#'}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      hasContent ? 'hover:bg-muted hover:border-primary/20' : 'opacity-75 cursor-default'
                    }`}
                  >
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <BookOpen 
                        className="h-4 w-4" 
                        style={{ color: category.color || undefined }} 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Newsletter CTA */}
        <NewsletterSignup variant="card" />
      </div>
    </div>
  );
}
