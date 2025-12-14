import { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { blogPosts, blogCategories, users } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import {
  Plus,
  FileText,
  Eye,
  Clock,
  MoreHorizontal,
  Search,
  Filter,
  Folder,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { NeptuneButton } from "@/components/ui/neptune-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Posts | Content Cockpit",
  description: "Manage all Launchpad blog posts and content",
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
      db
        .select({ count: count() })
        .from(blogPosts)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(blogPosts)
        .where(eq(blogPosts.status, "draft"))
        .then((r) => r[0]?.count ?? 0),
    ]);

    return { total: totalPosts, published: publishedPosts, drafts: draftPosts };
  } catch {
    return { total: 0, published: 0, drafts: 0 };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "published":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "draft":
      return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    case "scheduled":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "archived":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  }
}

export default async function PostsPage() {
  const [posts, categories, stats] = await Promise.all([
    getPosts(),
    getCategoryCounts(),
    getContentStats(),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content">
            <NeptuneButton size="icon" aria-label="Back to Content Cockpit">
              <ArrowLeft className="h-4 w-4" />
            </NeptuneButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Posts</h1>
            <p className="text-muted-foreground">
              Manage all Launchpad articles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/content/new">
            <NeptuneButton variant="primary" className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </NeptuneButton>
          </Link>
        </div>
      </div>

      {/* Stats Bar - Centered badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
          <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          <span className="font-semibold">{stats.total}</span>
          <span className="ml-1 text-blue-600/70 font-normal">Total Posts</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <Eye className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          <span className="font-semibold">{stats.published}</span>
          <span className="ml-1 text-green-600/70 font-normal">Published</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 transition-colors">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
          <span className="font-semibold">{stats.drafts}</span>
          <span className="ml-1 text-zinc-600/70 font-normal">Drafts</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Folder className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          <span className="font-semibold">{categories.length}</span>
          <span className="ml-1 text-purple-600/70 font-normal">
            Categories
          </span>
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-9" />
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
              : "No posts yet. Create your first post to get started."}
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
                        {post.title || "Untitled"}
                      </Link>
                      {post.featured && (
                        <Badge variant="secondary" className="text-xs">
                          Featured
                        </Badge>
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
                        Updated{" "}
                        {formatDistanceToNow(new Date(post.updatedAt), {
                          addSuffix: true,
                        })}
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
                Create your first Launchpad post to start engaging your
                audience.
              </p>
              <Link href="/admin/content/new">
                <NeptuneButton variant="primary" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Post
                </NeptuneButton>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

