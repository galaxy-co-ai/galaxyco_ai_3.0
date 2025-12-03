import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogCategories, blogPosts } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { ArrowLeft, Plus, Folder, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoriesClient } from '@/components/admin/CategoriesClient';

export const metadata: Metadata = {
  title: 'Categories | Content Studio',
  description: 'Manage blog categories',
};

async function getCategories() {
  try {
    const categories = await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
        description: blogCategories.description,
        icon: blogCategories.icon,
        color: blogCategories.color,
        sortOrder: blogCategories.sortOrder,
        isActive: blogCategories.isActive,
      })
      .from(blogCategories)
      .orderBy(blogCategories.sortOrder);

    // Get post counts for each category
    const postCounts = await db
      .select({
        categoryId: blogPosts.categoryId,
        count: count(),
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .groupBy(blogPosts.categoryId);

    const countMap = new Map(
      postCounts.map(pc => [pc.categoryId, pc.count])
    );

    return categories.map(cat => ({
      ...cat,
      postCount: countMap.get(cat.id) || 0,
    }));
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">
              Organize your Launchpad content into categories
            </p>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
