import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { expensiveOperationLimit } from "@/lib/rate-limit";
import { eq, and, isNotNull, desc, ne } from "drizzle-orm";
import {
  calculatePriorityScores,
  type TopicForScoring,
  type ScoringContext,
} from "@/lib/ai/hit-list-prioritizer";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * POST /api/admin/ai/hit-list/prioritize
 *
 * AI calculates priority scores for all hit list items.
 * Updates priorityScore and priorityScoreBreakdown in database.
 */
const prioritizeSchema = z.object({
  // Optional: only prioritize specific items
  itemIds: z.array(z.string().uuid()).optional(),
  // Optional: industry context for better scoring
  industryContext: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limiting for expensive AI operation
    const rateLimitResult = await expensiveOperationLimit(`hit-list-prioritize:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const body = await request.json();
    const validatedData = prioritizeSchema.parse(body);

    // Fetch hit list items to score
    const conditions = [
      eq(topicIdeas.workspaceId, workspaceId),
      isNotNull(topicIdeas.hitListAddedAt),
      ne(topicIdeas.status, "archived"),
    ];

    const hitListItems = await db
      .select({
        id: topicIdeas.id,
        title: topicIdeas.title,
        description: topicIdeas.description,
        whyItWorks: topicIdeas.whyItWorks,
        category: topicIdeas.category,
        targetPublishDate: topicIdeas.targetPublishDate,
      })
      .from(topicIdeas)
      .where(and(...conditions));

    // Filter to specific items if requested
    let itemsToScore: TopicForScoring[] = hitListItems;
    if (validatedData.itemIds && validatedData.itemIds.length > 0) {
      const idsSet = new Set(validatedData.itemIds);
      itemsToScore = hitListItems.filter((item) => idsSet.has(item.id));
    }

    if (itemsToScore.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items to prioritize",
        updatedCount: 0,
      });
    }

    // Fetch existing content for context (using topicIdeas that were published)
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

    // Build scoring context
    const context: ScoringContext = {
      existingContent: existingContent.map((c) => ({
        title: c.title,
        category: c.category,
        publishedAt: c.publishedAt,
      })),
      recentTopics: hitListItems.map((t) => t.title).slice(0, 20),
      industryContext: validatedData.industryContext,
    };

    // Calculate priority scores
    const scores = await calculatePriorityScores(itemsToScore, context);

    // Update items with new scores
    let updatedCount = 0;
    for (const score of scores) {
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
      } catch (updateError) {
        logger.error("[HitListPrioritize] Failed to update item", {
          topicId: score.topicId,
          error: updateError,
        });
      }
    }

    // Optionally reorder by new scores
    const scoredItems = scores.sort((a, b) => b.totalScore - a.totalScore);
    for (let i = 0; i < scoredItems.length; i++) {
      await db
        .update(topicIdeas)
        .set({
          hitListPosition: i + 1,
        })
        .where(
          and(
            eq(topicIdeas.id, scoredItems[i].topicId),
            eq(topicIdeas.workspaceId, workspaceId)
          )
        );
    }

    logger.info("Hit list prioritization complete", {
      workspaceId,
      updatedCount,
      totalItems: itemsToScore.length,
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      scores: scores.map((s) => ({
        topicId: s.topicId,
        totalScore: s.totalScore,
      })),
    });
  } catch (error) {
    logger.error("Failed to prioritize hit list", error);

    return createErrorResponse(error, "Hit list prioritization error");
  }
}

