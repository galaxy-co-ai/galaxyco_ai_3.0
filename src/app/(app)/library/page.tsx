import { Metadata } from 'next';
import KnowledgeBaseDashboard from '@/components/knowledge-base/KnowledgeBaseDashboard';
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { knowledgeItems, knowledgeCollections } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Library | GalaxyCo.ai',
  description: 'Organize, search, and access your documents and resources',
};

export default async function LibraryPage() {
  let initialCollections: Array<{
    id: string;
    name: string;
    description: string;
    itemCount: number;
    color?: string;
    icon?: string;
  }> = [];

  let initialItems: Array<{
    id: string;
    name: string;
    type: string;
    project: string;
    createdBy: string;
    createdAt: string;
    size: string;
    description: string;
    content?: string;
    url?: string;
  }> = [];

  try {
    const { workspaceId } = await getCurrentWorkspace();

    const [collections, items] = await Promise.all([
      db.query.knowledgeCollections.findMany({
        where: eq(knowledgeCollections.workspaceId, workspaceId),
        orderBy: [desc(knowledgeCollections.createdAt)],
      }),
      db.query.knowledgeItems.findMany({
        where: eq(knowledgeItems.workspaceId, workspaceId),
        orderBy: [desc(knowledgeItems.createdAt)],
        limit: 100,
        with: {
          collection: true,
        },
      }),
    ]);

    initialCollections = collections.map((col) => ({
      id: col.id,
      name: col.name,
      description: col.description || '',
      itemCount: col.itemCount,
      color: col.color || undefined,
      icon: col.icon || undefined,
    }));

    initialItems = items.map((item) => {
      const collection = item.collection as { name?: string } | null;
      return {
        id: item.id,
        name: item.title,
        type: item.type.toUpperCase(),
        project: collection?.name || 'Uncategorized',
        createdBy: 'User',
        createdAt: formatRelativeTime(item.createdAt),
        size: item.fileSize ? formatFileSize(item.fileSize) : 'N/A',
        description: item.summary || item.content?.substring(0, 100) || '',
        content: item.content || undefined,
        url: item.sourceUrl || undefined,
      };
    });
  } catch (error) {
    // On error, fall back to empty state; ErrorBoundary + dashboard will handle UI.
  }

  return (
    <ErrorBoundary>
      <KnowledgeBaseDashboard
        initialCollections={initialCollections}
        initialItems={initialItems}
      />
    </ErrorBoundary>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}





