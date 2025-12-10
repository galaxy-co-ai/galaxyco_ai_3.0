/**
 * Hit List Prioritization Job
 *
 * Runs daily at 6 AM UTC to:
 * 1. Gather external signals (industry trends, competitor content)
 * 2. Analyze internal signals (engagement patterns, content gaps)
 * 3. Calculate weighted scores for each hit list item
 * 4. Update priorityScore in database
 * 5. Reorder list by score
 * 6. Create alert badge for significant priority changes
 */

import { schedules, task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaces, topicIdeas, alertBadges } from "@/db/schema";
import { eq, and, isNotNull, ne, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  calculatePriorityScores,
  type TopicForScoring,
  type ScoringContext,
} from "@/lib/ai/hit-list-prioritizer";

// ============================================================================
// TYPES
// ============================================================================

interface PrioritizationResult {
  workspaceId: string;
  itemsProcessed: number;
  itemsUpdated: number;
  significantChanges: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function prioritizeWorkspaceHitList(
  workspaceId: string
): Promise<PrioritizationResult> {
  // Fetch hit list items (not archived)
  const hitListItems = await db
    .select({
      id: topicIdeas.id,
      title: topicIdeas.title,
      description: topicIdeas.description,
      whyItWorks: topicIdeas.whyItWorks,
      category: topicIdeas.category,
      targetPublishDate: topicIdeas.targetPublishDate,
      priorityScore: topicIdeas.priorityScore,
    })
    .from(topicIdeas)
    .where(
      and(
        eq(topicIdeas.workspaceId, workspaceId),
        isNotNull(topicIdeas.hitListAddedAt),
        ne(topicIdeas.status, "archived"),
        ne(topicIdeas.status, "published")
      )
    );

  if (hitListItems.length === 0) {
    return {
      workspaceId,
      itemsProcessed: 0,
      itemsUpdated: 0,
      significantChanges: 0,
    };
  }

  // Fetch existing content for context (using published topic ideas)
  const existingContent = await db
    .select({
      title: topicIdeas.title,
      category: topicIdeas.category,
      publishedAt: topicIdeas.updatedAt,
    })
    .from(topicIdeas)
    .where(
      and(
        eq(topicIdeas.workspaceId, workspaceId),
        eq(topicIdeas.status, "published")
      )
    )
    .orderBy(desc(topicIdeas.updatedAt))
    .limit(50);

  // Prepare topics for scoring
  const topicsToScore: TopicForScoring[] = hitListItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    whyItWorks: item.whyItWorks,
    category: item.category,
    targetPublishDate: item.targetPublishDate,
  }));

  // Build context
  const context: ScoringContext = {
    existingContent: existingContent.map((c) => ({
      title: c.title,
      category: c.category,
      publishedAt: c.publishedAt,
    })),
    recentTopics: hitListItems.map((t) => t.title).slice(0, 20),
  };

  // Calculate scores
  const scores = await calculatePriorityScores(topicsToScore, context);

  // Track old scores for comparison
  const oldScores = new Map(
    hitListItems.map((item) => [item.id, item.priorityScore])
  );

  // Update items with new scores
  let updatedCount = 0;
  let significantChanges = 0;
  const SIGNIFICANT_CHANGE_THRESHOLD = 15; // 15 point change

  for (const score of scores) {
    const oldScore = oldScores.get(score.topicId);

    try {
      await db
        .update(topicIdeas)
        .set({
          priorityScore: score.totalScore,
          priorityScoreBreakdown: score.breakdown,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(topicIdeas.id, score.topicId),
            eq(topicIdeas.workspaceId, workspaceId)
          )
        );
      updatedCount++;

      // Track significant changes
      if (
        oldScore !== null &&
        oldScore !== undefined &&
        Math.abs(score.totalScore - oldScore) >= SIGNIFICANT_CHANGE_THRESHOLD
      ) {
        significantChanges++;
      }
    } catch (error) {
      logger.error("[HitListPrioritization] Failed to update item", {
        topicId: score.topicId,
        error,
      });
    }
  }

  // Reorder by score
  const sortedScores = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  for (let i = 0; i < sortedScores.length; i++) {
    await db
      .update(topicIdeas)
      .set({
        hitListPosition: i + 1,
      })
      .where(
        and(
          eq(topicIdeas.id, sortedScores[i].topicId),
          eq(topicIdeas.workspaceId, workspaceId)
        )
      );
  }

  // Create alert if there were significant changes
  if (significantChanges > 0) {
    await db.insert(alertBadges).values({
      workspaceId,
      type: "suggestion",
      status: "unread",
      title: "Hit List Priorities Updated",
      message: `AI has re-scored your hit list. ${significantChanges} topic${
        significantChanges !== 1 ? "s" : ""
      } had significant priority changes. Review your updated content queue.`,
      actionLabel: "View Hit List",
      actionUrl: "/admin/content/hit-list",
      priority: 40,
    });
  }

  return {
    workspaceId,
    itemsProcessed: hitListItems.length,
    itemsUpdated: updatedCount,
    significantChanges,
  };
}

// ============================================================================
// TRIGGER.DEV TASKS
// ============================================================================

/**
 * Prioritize hit list for a single workspace
 */
export const prioritizeWorkspaceTask = task({
  id: "prioritize-workspace-hit-list",
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;

    logger.info("[HitListPrioritization] Starting prioritization", {
      workspaceId,
    });

    try {
      const result = await prioritizeWorkspaceHitList(workspaceId);

      logger.info("[HitListPrioritization] Prioritization complete", result);

      return { success: true, ...result };
    } catch (error) {
      logger.error("[HitListPrioritization] Failed", { workspaceId, error });
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Daily scheduled job to prioritize hit lists for all workspaces
 * Runs every day at 6 AM UTC
 */
export const scheduledHitListPrioritization = schedules.task({
  id: "scheduled-hit-list-prioritization",
  // Run every day at 6 AM UTC
  cron: "0 6 * * *",
  run: async () => {
    logger.info("[HitListPrioritization] Starting daily prioritization");

    try {
      // Get all workspaces that have items in their hit list
      const workspacesWithHitList = await db
        .selectDistinct({ id: workspaces.id })
        .from(workspaces)
        .innerJoin(topicIdeas, eq(topicIdeas.workspaceId, workspaces.id))
        .where(isNotNull(topicIdeas.hitListAddedAt));

      logger.info("[HitListPrioritization] Processing workspaces", {
        count: workspacesWithHitList.length,
      });

      let processed = 0;
      let failed = 0;
      let totalItemsUpdated = 0;

      // Process each workspace
      for (const workspace of workspacesWithHitList) {
        try {
          const result = await prioritizeWorkspaceTask.trigger({
            workspaceId: workspace.id,
          });
          processed++;
        } catch (error) {
          logger.error("[HitListPrioritization] Failed for workspace", {
            workspaceId: workspace.id,
            error,
          });
          failed++;
        }
      }

      logger.info("[HitListPrioritization] Daily prioritization complete", {
        processed,
        failed,
      });

      return { processed, failed };
    } catch (error) {
      logger.error("[HitListPrioritization] Daily prioritization failed", {
        error,
      });
      throw error;
    }
  },
});

