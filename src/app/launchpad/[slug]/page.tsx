import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories, users } from '@/db/schema';
import { eq, desc, and, ne } from 'drizzle-orm';
import { Clock, Calendar, ChevronRight, ArrowLeft, Share2, ThumbsUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ReadingProgressBar } from '@/components/launchpad/ReadingProgressBar';
import { BookmarkButton } from '@/components/launchpad/BookmarkButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Get post by slug
async function getPost(slug: string) {
  try {
    const post = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImage: blogPosts.featuredImage,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        viewCount: blogPosts.viewCount,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        ogImage: blogPosts.ogImage,
        categoryId: blogPosts.categoryId,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        categoryColor: blogCategories.color,
        authorId: blogPosts.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorAvatar: users.avatarUrl,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(
        and(
          eq(blogPosts.slug, slug),
          eq(blogPosts.status, 'published')
        )
      )
      .limit(1);

    return post[0] || null;
  } catch {
    return null;
  }
}

// Get related posts
async function getRelatedPosts(categoryId: string | null, currentPostId: string) {
  try {
    if (!categoryId) return [];

    return await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        categoryName: blogCategories.name,
        categoryColor: blogCategories.color,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(
        and(
          eq(blogPosts.status, 'published'),
          eq(blogPosts.categoryId, categoryId),
          ne(blogPosts.id, currentPostId)
        )
      )
      .orderBy(desc(blogPosts.publishedAt))
      .limit(3);
  } catch {
    return [];
  }
}

// Increment view count
async function incrementViewCount(postId: string) {
  try {
    await db
      .update(blogPosts)
      .set({ viewCount: (blogPosts.viewCount as unknown as number) + 1 })
      .where(eq(blogPosts.id, postId));
  } catch {
    // Ignore errors
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found | Launchpad',
    };
  }

  return {
    title: post.metaTitle || `${post.title} | Launchpad`,
    description: post.metaDescription || post.excerpt || '',
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: post.ogImage || post.featuredImage ? [post.ogImage || post.featuredImage!] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Increment view count (fire and forget)
  incrementViewCount(post.id);

  const relatedPosts = await getRelatedPosts(post.categoryId, post.id);
  const authorName = post.authorFirstName && post.authorLastName
    ? `${post.authorFirstName} ${post.authorLastName}`
    : 'GalaxyCo Team';
  const authorInitials = post.authorFirstName && post.authorLastName
    ? `${post.authorFirstName[0]}${post.authorLastName[0]}`
    : 'GT';

  return (
    <>
      {/* Reading Progress Bar */}
      <ReadingProgressBar postId={post.id} />
      
      <article className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/launchpad" className="hover:text-foreground transition-colors">
          Launchpad
        </Link>
        <ChevronRight className="h-4 w-4" />
        {post.categoryName && (
          <>
            <Link 
              href={`/launchpad/category/${post.categorySlug}`}
              className="hover:text-foreground transition-colors"
            >
              {post.categoryName}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground truncate">{post.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div>
          {/* Header */}
          <header className="mb-8">
            {post.categoryName && (
              <Badge 
                className="mb-4"
                style={{ 
                  backgroundColor: post.categoryColor ? `${post.categoryColor}20` : undefined,
                  color: post.categoryColor || undefined,
                }}
              >
                {post.categoryName}
              </Badge>
            )}
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.authorAvatar || undefined} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <span>{authorName}</span>
              </div>
              
              {post.publishedAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                </div>
              )}
              
              {post.readingTimeMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readingTimeMinutes} min read
                </div>
              )}
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none
              prose-headings:font-semibold
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-base prose-p:leading-7 prose-p:mb-4
              prose-a:text-primary prose-a:underline
              prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-zinc-900 prose-pre:text-zinc-100
              prose-img:rounded-lg
              prose-hr:border-border
              prose-ul:my-4 prose-ol:my-4
              prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Actions */}
          <div className="flex items-center gap-4 mt-8 pt-8 border-t">
            <Button variant="outline" className="gap-2">
              <ThumbsUp className="h-4 w-4" />
              Was this helpful?
            </Button>
            <BookmarkButton postId={post.id} />
            <Button variant="ghost" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Author Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Written by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.authorAvatar || undefined} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{authorName}</p>
                  <p className="text-sm text-muted-foreground">GalaxyCo.ai</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Related Articles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedPosts.map((related) => (
                  <Link 
                    key={related.id}
                    href={`/launchpad/${related.slug}`}
                    className="block p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-sm line-clamp-2">{related.title}</p>
                    {related.readingTimeMinutes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {related.readingTimeMinutes} min read
                      </p>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Back to Launchpad */}
          <Link href="/launchpad">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Launchpad
            </Button>
          </Link>
        </aside>
      </div>

      {/* More Articles */}
      {relatedPosts.length > 0 && (
        <section className="mt-16">
          <Separator className="mb-8" />
          <h2 className="text-xl font-semibold mb-6">More in {post.categoryName}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link key={related.id} href={`/launchpad/${related.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/20 group">
                  {related.featuredImage && (
                    <div className="aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={related.featuredImage} 
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {related.title}
                    </CardTitle>
                  </CardHeader>
                  {related.excerpt && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.excerpt}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
    </>
  );
}
