import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  neptuneKnowledgeBase,
  neptuneUserKnowledgeBase,
  neptuneTutorials,
  neptuneUserTutorialProgress,
  neptuneQuickTips,
} from '@/db/schema';
import { eq, and, sql, asc, desc } from 'drizzle-orm';
import { getCurrentWorkspace } from '@/lib/auth';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/training
 * Returns knowledge base items, quick tips, and tutorial progress
 */
export async function GET() {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const currentUserId = user?.id;

    // Get knowledge base items with user starred status
    const knowledgeBaseItems = await db
      .select({
        id: neptuneKnowledgeBase.id,
        title: neptuneKnowledgeBase.title,
        category: neptuneKnowledgeBase.category,
        type: neptuneKnowledgeBase.contentType,
        lastUpdated: neptuneKnowledgeBase.updatedAt,
        views: neptuneKnowledgeBase.views,
        starred: sql<boolean>`COALESCE(${neptuneUserKnowledgeBase.starred}, false)`,
      })
      .from(neptuneKnowledgeBase)
      .leftJoin(
        neptuneUserKnowledgeBase,
        and(
          eq(neptuneUserKnowledgeBase.knowledgeBaseId, neptuneKnowledgeBase.id),
          currentUserId ? eq(neptuneUserKnowledgeBase.userId, currentUserId) : sql`false`
        )
      )
      .where(eq(neptuneKnowledgeBase.workspaceId, workspaceId))
      .orderBy(desc(neptuneKnowledgeBase.views));

    // Get unique categories from knowledge base
    const categoriesResult = await db
      .selectDistinct({ category: neptuneKnowledgeBase.category })
      .from(neptuneKnowledgeBase)
      .where(eq(neptuneKnowledgeBase.workspaceId, workspaceId))
      .orderBy(asc(neptuneKnowledgeBase.category));

    const categories = categoriesResult.map((c: { category: string }) => c.category);

    // Get quick tips
    const quickTipsData = await db.query.neptuneQuickTips.findMany({
      where: and(
        eq(neptuneQuickTips.workspaceId, workspaceId),
        eq(neptuneQuickTips.isActive, true)
      ),
      orderBy: [asc(neptuneQuickTips.sortOrder)],
    });

    // Get tutorials with user progress
    const tutorialsData = await db
      .select({
        id: neptuneTutorials.id,
        title: neptuneTutorials.title,
        totalSteps: neptuneTutorials.totalSteps,
        estimatedMinutes: neptuneTutorials.estimatedMinutes,
        completedSteps: sql<number>`COALESCE(${neptuneUserTutorialProgress.completedSteps}, 0)`,
      })
      .from(neptuneTutorials)
      .leftJoin(
        neptuneUserTutorialProgress,
        and(
          eq(neptuneUserTutorialProgress.tutorialId, neptuneTutorials.id),
          currentUserId ? eq(neptuneUserTutorialProgress.userId, currentUserId) : sql`false`
        )
      )
      .where(eq(neptuneTutorials.workspaceId, workspaceId))
      .orderBy(asc(neptuneTutorials.sortOrder));

    // Format tutorials with progress calculation
    interface TutorialRow {
      id: string;
      title: string;
      totalSteps: number;
      estimatedMinutes: number;
      completedSteps: number;
    }

    const tutorials = tutorialsData.map((t: TutorialRow) => {
      const progress = t.totalSteps > 0 
        ? Math.round((t.completedSteps / t.totalSteps) * 100) 
        : 0;
      const remainingSteps = t.totalSteps - t.completedSteps;
      const remainingMinutes = t.totalSteps > 0 
        ? Math.ceil((remainingSteps / t.totalSteps) * t.estimatedMinutes)
        : 0;
      
      return {
        id: t.id,
        title: t.title,
        progress,
        totalSteps: t.totalSteps,
        completedSteps: t.completedSteps,
        estimatedTime: progress === 0 
          ? `${t.estimatedMinutes} min`
          : progress === 100 
            ? 'Complete'
            : `${remainingMinutes} min left`,
      };
    });

    // Format knowledge base for response
    interface KnowledgeBaseRow {
      id: string;
      title: string;
      category: string;
      type: 'guide' | 'video' | 'document' | 'faq';
      lastUpdated: Date | null;
      views: number;
      starred: boolean;
    }

    const knowledgeBase = knowledgeBaseItems.map((item: KnowledgeBaseRow) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      type: item.type,
      lastUpdated: item.lastUpdated?.toISOString() ?? new Date().toISOString(),
      views: item.views,
      starred: item.starred,
    }));

    // Format quick tips for response
    const quickTips = quickTipsData.map((tip) => ({
      id: tip.id,
      title: tip.title,
      description: tip.description,
      category: tip.category,
    }));

    return NextResponse.json({
      knowledgeBase,
      quickTips,
      tutorials,
      categories: categories.length > 0 ? categories : ['Getting Started', 'Agents', 'Integrations', 'Best Practices', 'API Reference'],
    });
  } catch (error) {
    return createErrorResponse(error, 'Training data error');
  }
}
