import { Metadata } from 'next';
import { db } from '@/lib/db';
import { blogCategories, blogPosts } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
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
    <div className="p-6 h-full">
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
