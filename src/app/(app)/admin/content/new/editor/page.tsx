import { Metadata } from 'next';
import { db } from '@/lib/db';
import { blogCategories } from '@/db/schema';
import { PostEditorClient } from '@/components/admin/PostEditorClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Post | Content Studio',
  description: 'Create a new Launchpad blog post',
};

async function getCategories() {
  try {
    return await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
      })
      .from(blogCategories)
      .orderBy(blogCategories.sortOrder);
  } catch {
    return [];
  }
}

export default async function EditorOnlyPage() {
  const categories = await getCategories();

  return (
    <PostEditorClient 
      categories={categories}
      mode="create"
    />
  );
}

