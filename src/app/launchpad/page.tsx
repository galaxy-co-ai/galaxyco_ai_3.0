import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { Rocket } from 'lucide-react';
import { Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { NewsletterSignup } from '@/components/launchpad/NewsletterSignup';
import { LaunchpadHero } from '@/components/launchpad/LaunchpadHero';
import { LaunchpadSidebar } from '@/components/launchpad/LaunchpadSidebar';

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
        contentType: blogPosts.contentType,
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

// Get tool spotlight posts
async function getToolSpotlightPosts() {
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
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        categoryColor: blogCategories.color,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(
        and(
          eq(blogPosts.status, 'published'),
          eq(blogPosts.contentType, 'tool-spotlight')
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(4);
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
    featured?: boolean;
    categoryName: string | null;
    categorySlug: string | null;
    categoryColor: string | null;
  };
  isDemo?: boolean;
}) {
  const cardContent = (
    <Card className={`h-full transition-all duration-200 group overflow-hidden relative ${
      isDemo 
        ? 'opacity-80 border-dashed' 
        : 'hover:shadow-soft-hover hover:border-primary/20 cursor-pointer'
    }`}>
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
        <CardTitle className={`text-base leading-snug line-clamp-2 ${!isDemo && 'group-hover:text-primary'} transition-colors`}>
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
  const [posts, categories, trending, toolSpotlights] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTrendingPosts(),
    getToolSpotlightPosts(),
  ]);

  // Use real content if available, otherwise show demo
  const hasContent = posts.length > 0;
  const displayCategories = categories.length > 0 ? categories : DEMO_CATEGORIES;
  const displayFeatured = hasContent ? posts.filter(p => p.featured).slice(0, 2) : DEMO_FEATURED_POSTS;
  const displayTrending = trending.length > 0 ? trending : DEMO_TRENDING;
  const displayPosts = hasContent ? posts.filter(p => !p.featured && p.contentType !== 'tool-spotlight') : DEMO_POSTS;
  const displayToolSpotlights = toolSpotlights.length > 0 ? toolSpotlights : [];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Category Nav - Client Component */}
      <LaunchpadHero 
        categories={displayCategories} 
        hasContent={hasContent} 
      />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Demo Banner */}
        {!hasContent && (
          <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <Sparkles className="inline h-4 w-4 mr-1.5" />
              <strong>Preview Mode:</strong> This is demo content showing the Launchpad layout. 
              Create your first post in Mission Control to see real content here.
            </p>
          </div>
        )}

        {/* AI Tools Spotlight */}
        {displayToolSpotlights.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-1.5 rounded-lg bg-purple-500/10">
                <Rocket className="h-4 w-4 text-purple-500" />
              </div>
              <h2 className="text-lg font-semibold">AI Tools Spotlight</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {displayToolSpotlights.map((post) => (
                <PostCard key={post.id} post={post} isDemo={false} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Posts */}
        <section className="mb-14">
          <div className="flex items-center gap-2.5 mb-6">
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
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Latest Articles - 2 columns */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Latest Articles</h2>
              {hasContent && posts.length > 6 && (
                <Link href="/launchpad/all" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {displayPosts.slice(0, 6).map((post) => (
                <PostCard key={post.id} post={post} isDemo={!hasContent} />
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <LaunchpadSidebar 
            trending={displayTrending}
            categories={displayCategories}
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
