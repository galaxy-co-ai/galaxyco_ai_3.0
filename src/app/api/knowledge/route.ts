import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeCollections } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    // Get collections
    const collections = await db.query.knowledgeCollections.findMany({
      where: eq(knowledgeCollections.workspaceId, workspaceId),
      orderBy: [desc(knowledgeCollections.createdAt)],
    });

    // Get items
    const whereConditions = [eq(knowledgeItems.workspaceId, workspaceId)];
    if (collectionId) {
      whereConditions.push(eq(knowledgeItems.collectionId, collectionId));
    }

    const items = await db.query.knowledgeItems.findMany({
      where: and(...whereConditions),
      orderBy: [desc(knowledgeItems.createdAt)],
      limit: 100,
      with: {
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      collections: collections.map((col: typeof collections[0]) => ({
        id: col.id,
        name: col.name,
        description: col.description,
        itemCount: col.itemCount,
        color: col.color,
        icon: col.icon,
      })),
      items: items.map((item: typeof items[0]) => ({
        id: item.id,
        name: item.title,
        type: item.type.toUpperCase(),
        project: item.collection?.name || 'Uncategorized',
        createdBy: item.creator
          ? item.creator.firstName && item.creator.lastName
            ? `${item.creator.firstName} ${item.creator.lastName}`
            : item.creator.email
          : 'User',
        createdAt: formatRelativeTime(item.createdAt),
        size: item.fileSize ? formatFileSize(item.fileSize) : 'N/A',
        description: item.summary || item.content?.substring(0, 100) || '',
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Knowledge Base API error');
  }
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









