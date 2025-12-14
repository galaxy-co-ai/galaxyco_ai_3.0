import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, blogCategories } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Get category by slug
async function getCategory(slug: string) {
  try {
    const categories = await db
      .select()
      .from(blogCategories)
      .where(
        and(
          eq(blogCategories.slug, slug),
          eq(blogCategories.isActive, true)
        )
      )
      .limit(1);

    return categories[0] || null;
  } catch {
    return null;
  }
}

// Get posts in category
async function getCategoryPosts(categoryId: string) {
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
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, 'published'),
          eq(blogPosts.categoryId, categoryId)
        )
      )
      .orderBy(desc(blogPosts.publishedAt));
  } catch {
    return [];
  }
}

// Get all categories for nav
async function getAllCategories() {
  try {
    return await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        color: blogCategories.color,
      })
      .from(blogCategories)
      .where(eq(blogCategories.isActive, true))
      .orderBy(blogCategories.sortOrder);
  } catch {
    return [];
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Category Not Found | Launchpad',
    };
  }

  return {
    title: `${category.name} | Launchpad`,
    description: category.description || `Browse articles about ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const [posts, allCategories] = await Promise.all([
    getCategoryPosts(category.id),
    getAllCategories(),
  ]);

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/launchpad" className="hover:text-foreground transition-colors">
          Launchpad
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: category.color || '#6B7280' }}
          />
          <h1 className="text-3xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-xl text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        )}
      </header>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link href="/launchpad">
          <Button variant="outline" size="sm" className="rounded-full">
            All
          </Button>
        </Link>
        {allCategories.map((cat) => (
          <Link key={cat.id} href={`/blog/category/${cat.slug}`}>
            <Button 
              variant={cat.slug === slug ? "secondary" : "outline"} 
              size="sm" 
              className="rounded-full"
              style={{
                borderColor: cat.color ? `${cat.color}40` : undefined,
                backgroundColor: cat.slug === slug && cat.color ? `${cat.color}20` : undefined,
              }}
            >
              {cat.name}
            </Button>
          </Link>
        ))}
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
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
                  {post.featured && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      Featured
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
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">
            No articles in this category yet.
          </p>
          <Link href="/launchpad">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to all articles
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
