import { Metadata } from 'next';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { blogCategories } from '@/db/schema';
import { NewPostWizard } from './NewPostWizard';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'New Article | Article Studio',
  description: 'Create a new article with AI assistance',
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

function WizardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default async function NewPostPage() {
  const categories = await getCategories();

  return (
    <Suspense fallback={<WizardLoading />}>
      <NewPostWizard categories={categories} />
    </Suspense>
  );
}
