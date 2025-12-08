import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { blogBookmarks, blogPosts, blogCategories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Clock, Bookmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { LaunchpadHero } from '@/components/launchpad/LaunchpadHero';

export const metadata: Metadata = {
  title: 'Bookmarks | Launchpad',
  description: 'Your saved articles',
};

async function getBookmarks(userId: string) {
  try {
    return await db
      .select({
        id: blogBookmarks.id,
        postId: blogBookmarks.postId,
        createdAt: blogBookmarks.createdAt,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        categoryName: blogCategories.name,
        categoryColor: blogCategories.color,
      })
      .from(blogBookmarks)
      .leftJoin(blogPosts, eq(blogBookmarks.postId, blogPosts.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(eq(blogBookmarks.userId, userId))
      .orderBy(desc(blogBookmarks.createdAt));
  } catch {
    return [];
  }
}

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

export default async function BookmarksPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/launchpad/bookmarks');
  }

  const [bookmarks, categories] = await Promise.all([
    getBookmarks(userId),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Tab Nav */}
      <LaunchpadHero 
        categories={categories} 
        hasContent={bookmarks.length > 0} 
      />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Bookmark className="h-5 w-5 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold">Your Bookmarks</h1>
          </div>
          <p className="text-muted-foreground">
            {bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Bookmarks Grid */}
        {bookmarks.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((bookmark) => (
              <Link key={bookmark.id} href={`/launchpad/${bookmark.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/20 group overflow-hidden">
                  {bookmark.featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={bookmark.featuredImage} 
                        alt={bookmark.title || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {bookmark.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookmark.excerpt && (
                      <CardDescription className="line-clamp-2 mb-3">
                        {bookmark.excerpt}
                      </CardDescription>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      {bookmark.readingTimeMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {bookmark.readingTimeMinutes} min
                        </span>
                      )}
                      <span>
                        Saved {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Bookmark className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Save articles for later by clicking the bookmark icon on any article.
            </p>
            <Link href="/launchpad">
              <Button>Browse Articles</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
