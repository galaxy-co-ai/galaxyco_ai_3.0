import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories, users } from '@/db/schema';
import { desc, eq, count } from 'drizzle-orm';
import { 
  Plus, 
  FileText, 
  Eye, 
  Clock, 
  MoreHorizontal,
  Search,
  Filter,
  Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = {
  title: 'Content Studio | Mission Control',
  description: 'Manage Launchpad blog posts and content',
};

// Get posts with author and category info
async function getPosts() {
  try {
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        status: blogPosts.status,
        featured: blogPosts.featured,
        viewCount: blogPosts.viewCount,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        categoryId: blogPosts.categoryId,
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
        authorId: blogPosts.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .orderBy(desc(blogPosts.updatedAt))
      .limit(50);
    
    return posts;
  } catch {
    return [];
  }
}

// Get category counts
async function getCategoryCounts() {
  try {
    const categories = await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        color: blogCategories.color,
      })
      .from(blogCategories)
      .orderBy(blogCategories.sortOrder);
    
    return categories;
  } catch {
    return [];
  }
}

// Get stats
async function getContentStats() {
  try {
    const [totalPosts, publishedPosts, draftPosts] = await Promise.all([
      db.select({ count: count() }).from(blogPosts).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'published')).then(r => r[0]?.count ?? 0),
      db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'draft')).then(r => r[0]?.count ?? 0),
    ]);
    
    return { total: totalPosts, published: publishedPosts, drafts: draftPosts };
  } catch {
    return { total: 0, published: 0, drafts: 0 };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'published':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'draft':
      return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    case 'scheduled':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'archived':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
  }
}

export default async function ContentStudioPage() {
  const [posts, categories, stats] = await Promise.all([
    getPosts(),
    getCategoryCounts(),
    getContentStats(),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Studio</h1>
          <p className="text-muted-foreground">
            Create and manage Launchpad articles
          </p>
        </div>
        <Link href="/admin/content/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-500/10">
                <Clock className="h-4 w-4 text-zinc-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.drafts}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Folder className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search posts..." 
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Link href="/admin/content/categories">
          <Button variant="outline" size="sm" className="gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </Button>
        </Link>
      </div>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
          <CardDescription>
            {posts.length > 0 
              ? `Showing ${posts.length} posts` 
              : 'No posts yet. Create your first post to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length > 0 ? (
            <div className="divide-y">
              {posts.map((post) => (
                <div key={post.id} className="py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        href={`/admin/content/${post.id}`}
                        className="font-medium hover:text-primary transition-colors truncate"
                      >
                        {post.title || 'Untitled'}
                      </Link>
                      {post.featured && (
                        <Badge variant="secondary" className="text-xs">Featured</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(post.status)}`}
                      >
                        {post.status}
                      </Badge>
                      {post.categoryName && (
                        <span className="truncate">{post.categoryName}</span>
                      )}
                      {post.readingTimeMinutes && (
                        <span>{post.readingTimeMinutes} min read</span>
                      )}
                      <span>
                        Updated {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex items-center gap-1 text-sm">
                      <Eye className="h-3.5 w-3.5" />
                      {post.viewCount}
                    </div>
                    <Link href={`/admin/content/${post.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first Launchpad post to start engaging your audience.
              </p>
              <Link href="/admin/content/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Post
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
