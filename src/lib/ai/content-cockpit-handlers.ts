/**
 * Content Cockpit AI Handlers
 *
 * Provides conversational AI handlers for Content Cockpit features.
 * Handles natural language requests like:
 * - "create an article about X" → guides to Article Studio
 * - "what should I write next" → queries Hit List priorities
 * - "find sources for X" → triggers source discovery
 * - "create a use case for X" → guides to Use Case Studio
 */

import { db } from "@/lib/db";
import {
  topicIdeas,
  contentSources,
  useCases,
  articleAnalytics,
  blogPosts,
  alertBadges,
} from "@/db/schema";
import { eq, and, desc, sql, isNotNull, gte, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getOpenAI } from "@/lib/ai-providers";
import { calculatePriorityScores } from "./hit-list-prioritizer";

// ============================================================================
// TYPES
// ============================================================================

export interface ContentCockpitContext {
  workspaceId: string;
  userId: string;
}

export interface ContentSuggestion {
  type: "article" | "source" | "use_case" | "insight";
  title: string;
  description: string;
  action?: {
    type: "navigate" | "create" | "analyze";
    target: string;
    params?: Record<string, unknown>;
  };
  priority: number;
}

export interface HitListInsight {
  topPriority: {
    id: string;
    title: string;
    score: number;
    reason: string;
  } | null;
  totalQueued: number;
  inProgress: number;
  recentlyPublished: number;
  recommendation: string;
}

export interface ContentPerformanceInsight {
  totalViews: number;
  totalArticles: number;
  topPerformer: {
    id: string;
    title: string;
    views: number;
  } | null;
  trend: "up" | "down" | "stable";
  recommendation: string;
}

// ============================================================================
// HIT LIST HANDLERS
// ============================================================================

/**
 * Get insights about what to write next
 */
export async function getWhatToWriteNext(
  ctx: ContentCockpitContext
): Promise<HitListInsight> {
  try {
    // Get hit list items sorted by priority score
    const hitListItems = await db
      .select({
        id: topicIdeas.id,
        title: topicIdeas.title,
        description: topicIdeas.description,
        priorityScore: topicIdeas.priorityScore,
        status: topicIdeas.status,
        priorityScoreBreakdown: topicIdeas.priorityScoreBreakdown,
      })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, ctx.workspaceId),
          isNotNull(topicIdeas.hitListAddedAt)
        )
      )
      .orderBy(desc(topicIdeas.priorityScore))
      .limit(20);

    // Count by status
    const queued = hitListItems.filter((i) => i.status === "saved").length;
    const inProgress = hitListItems.filter(
      (i) => i.status === "in_progress"
    ).length;

    // Get recently published count
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [publishedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, ctx.workspaceId),
          eq(topicIdeas.status, "published"),
          gte(topicIdeas.updatedAt, thirtyDaysAgo)
        )
      );

    // Get top priority item
    const topItem = hitListItems.find((i) => i.status === "saved");

    // Generate recommendation
    let recommendation = "";
    if (queued === 0) {
      recommendation =
        "Your hit list is empty! Consider adding some topic ideas to plan your content calendar.";
    } else if (inProgress > 2) {
      recommendation = `You have ${inProgress} articles in progress. Consider finishing one before starting new work.`;
    } else if (topItem) {
      recommendation = `I recommend working on "${topItem.title}" next - it has the highest priority score.`;
    }

    const breakdown = topItem?.priorityScoreBreakdown as Record<
      string,
      unknown
    > | null;
    const reason =
      breakdown?.reasoning &&
      typeof breakdown.reasoning === "object" &&
      "trendingScore" in breakdown.reasoning
        ? (breakdown.reasoning.trendingScore as string)
        : "Based on current priority scoring";

    return {
      topPriority: topItem
        ? {
            id: topItem.id,
            title: topItem.title,
            score: topItem.priorityScore || 50,
            reason,
          }
        : null,
      totalQueued: queued,
      inProgress,
      recentlyPublished: Number(publishedCount?.count || 0),
      recommendation,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to get what to write next", {
      error,
    });
    return {
      topPriority: null,
      totalQueued: 0,
      inProgress: 0,
      recentlyPublished: 0,
      recommendation:
        "Unable to analyze your hit list at this time. Please try again.",
    };
  }
}

/**
 * Add a topic idea to the hit list from a conversation
 */
export async function addTopicToHitList(
  ctx: ContentCockpitContext,
  topic: {
    title: string;
    description?: string;
    whyItWorks?: string;
    category?: string;
    priority?: "low" | "medium" | "high" | "urgent";
  }
): Promise<{ success: boolean; topicId?: string; message: string }> {
  try {
    // Use a transaction with row-level locking to prevent race conditions
    // when calculating hitListPosition for concurrent inserts
    const [newTopic] = await db.transaction(async (tx) => {
      // Lock and get max position atomically
      const [maxPosition] = await tx
      .select({ maxPos: sql<number>`COALESCE(MAX(hit_list_position), 0)` })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, ctx.workspaceId),
          isNotNull(topicIdeas.hitListAddedAt)
        )
        )
        .for("update"); // Row-level lock to prevent concurrent reads

      return await tx
      .insert(topicIdeas)
      .values({
        workspaceId: ctx.workspaceId,
        title: topic.title,
        description: topic.description || null,
        whyItWorks: topic.whyItWorks || null,
        category: topic.category || null,
        generatedBy: "ai", // Neptune AI generates topics
        status: "saved",
        hitListAddedAt: new Date(),
        hitListPosition: (maxPosition?.maxPos || 0) + 1,
        priority: topic.priority || "medium",
        difficultyLevel: "medium",
      })
      .returning();
    });

    logger.info("[ContentCockpit] Added topic to hit list via Neptune", {
      topicId: newTopic.id,
      title: newTopic.title,
      workspaceId: ctx.workspaceId,
    });

    return {
      success: true,
      topicId: newTopic.id,
      message: `Added "${topic.title}" to your hit list. You can find it in the Content Cockpit.`,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to add topic to hit list", { error });
    return {
      success: false,
      message: "Failed to add topic to hit list. Please try again.",
    };
  }
}

/**
 * Trigger reprioritization of the hit list
 */
export async function reprioritizeHitList(
  ctx: ContentCockpitContext
): Promise<{ success: boolean; message: string; changesCount: number }> {
  try {
    // Get existing published content for context
    // NOTE: blogPosts table doesn't have workspaceId as blog content is shared
    // across the platform (public blog). This is intentional for content gap analysis.
    // If workspace-scoped blogs are needed, add workspaceId to blogPosts schema.
    const existingContent = await db
      .select({
        title: blogPosts.title,
        categoryId: blogPosts.categoryId,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(50);

    // Get topics to score
    const topicsToScore = await db
      .select({
        id: topicIdeas.id,
        title: topicIdeas.title,
        description: topicIdeas.description,
        whyItWorks: topicIdeas.whyItWorks,
        category: topicIdeas.category,
        targetPublishDate: topicIdeas.targetPublishDate,
      })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, ctx.workspaceId),
          isNotNull(topicIdeas.hitListAddedAt),
          eq(topicIdeas.status, "saved")
        )
      );

    if (topicsToScore.length === 0) {
      return {
        success: true,
        message: "No topics in your hit list to reprioritize.",
        changesCount: 0,
      };
    }

    // Calculate new priority scores
    const scoringResults = await calculatePriorityScores(topicsToScore, {
      existingContent: existingContent.map((c) => ({
        title: c.title || "",
        category: null, // Using categoryId reference, category name not needed for scoring
        publishedAt: c.publishedAt,
      })),
      recentTopics: [],
    });

    // Update scores in database
    let changesCount = 0;
    for (const result of scoringResults) {
      await db
        .update(topicIdeas)
        .set({
          priorityScore: result.totalScore,
          priorityScoreBreakdown: result.breakdown,
          updatedAt: new Date(),
        })
        .where(eq(topicIdeas.id, result.topicId));
      changesCount++;
    }

    logger.info("[ContentCockpit] Reprioritized hit list via Neptune", {
      workspaceId: ctx.workspaceId,
      topicsScored: changesCount,
    });

    return {
      success: true,
      message: `Reprioritized ${changesCount} topics in your hit list based on current trends and content gaps.`,
      changesCount,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to reprioritize hit list", { error });
    return {
      success: false,
      message: "Failed to reprioritize hit list. Please try again.",
      changesCount: 0,
    };
  }
}

// ============================================================================
// CONTENT SOURCE HANDLERS
// ============================================================================

/**
 * Add a content source from a URL mentioned in conversation
 */
export async function addContentSource(
  ctx: ContentCockpitContext,
  source: {
    name: string;
    url: string;
    description?: string;
    type?: "news" | "research" | "competitor" | "inspiration" | "industry" | "other";
  }
): Promise<{ success: boolean; sourceId?: string; message: string }> {
  try {
    // Check if URL already exists
    const existing = await db
      .select({ id: contentSources.id })
      .from(contentSources)
      .where(
        and(
          eq(contentSources.workspaceId, ctx.workspaceId),
          eq(contentSources.url, source.url)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        message: "This source URL already exists in your Sources Hub.",
      };
    }

    const [newSource] = await db
      .insert(contentSources)
      .values({
        workspaceId: ctx.workspaceId,
        name: source.name,
        url: source.url,
        description: source.description || null,
        type: source.type || "other",
        status: "active",
        addedBy: ctx.userId,
      })
      .returning();

    logger.info("[ContentCockpit] Added content source via Neptune", {
      sourceId: newSource.id,
      url: source.url,
      workspaceId: ctx.workspaceId,
    });

    return {
      success: true,
      sourceId: newSource.id,
      message: `Added "${source.name}" to your Sources Hub.`,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to add content source", { error });
    return {
      success: false,
      message: "Failed to add source. Please try again.",
    };
  }
}

/**
 * Get source suggestions based on topics
 */
export async function getSuggestedSources(
  ctx: ContentCockpitContext
): Promise<{
  suggestions: Array<{ name: string; url: string; reason: string }>;
  count: number;
}> {
  try {
    // Get suggested sources from database
    const suggested = await db
      .select({
        id: contentSources.id,
        name: contentSources.name,
        url: contentSources.url,
        aiReviewNotes: contentSources.aiReviewNotes,
      })
      .from(contentSources)
      .where(
        and(
          eq(contentSources.workspaceId, ctx.workspaceId),
          eq(contentSources.status, "suggested")
        )
      )
      .orderBy(desc(contentSources.createdAt))
      .limit(5);

    return {
      suggestions: suggested.map((s) => ({
        name: s.name,
        url: s.url,
        reason: s.aiReviewNotes || "AI-discovered source based on your content",
      })),
      count: suggested.length,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to get source suggestions", {
      error,
    });
    return { suggestions: [], count: 0 };
  }
}

// ============================================================================
// USE CASE HANDLERS
// ============================================================================

/**
 * Get use case recommendations based on description
 */
export async function getUseCaseRecommendations(
  ctx: ContentCockpitContext,
  description: string
): Promise<{
  matchedUseCase: { id: string; name: string; match: number } | null;
  suggestion: string;
}> {
  try {
    // Get published use cases
    const publishedUseCases = await db
      .select({
        id: useCases.id,
        name: useCases.name,
        description: useCases.description,
        category: useCases.category,
      })
      .from(useCases)
      .where(
        and(
          eq(useCases.workspaceId, ctx.workspaceId),
          eq(useCases.status, "published")
        )
      );

    if (publishedUseCases.length === 0) {
      return {
        matchedUseCase: null,
        suggestion:
          "You don't have any published use cases yet. Consider creating one in the Use Case Studio to define roadmaps for different customer types.",
      };
    }

    // Use AI to match the description to a use case
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are matching a user description to available use cases. Return the best match with a confidence score 0-100.

Available use cases:
${publishedUseCases.map((uc) => `- ${uc.name} (ID: ${uc.id}): ${uc.description || uc.category}`).join("\n")}

Respond with JSON: { "matchedId": "id or null", "confidence": number, "reason": "explanation" }`,
        },
        {
          role: "user",
          content: `Match this description: "${description}"`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No AI response");
    }

    const parsed = JSON.parse(content) as {
      matchedId: string | null;
      confidence: number;
      reason: string;
    };

    const matched = publishedUseCases.find((uc) => uc.id === parsed.matchedId);

    return {
      matchedUseCase: matched
        ? {
            id: matched.id,
            name: matched.name,
            match: parsed.confidence,
          }
        : null,
      suggestion:
        // Only claim a match if we have both high confidence AND an actual matched use case
        parsed.confidence >= 70 && matched
          ? `I found a match! "${matched.name}" is ${parsed.confidence}% relevant. ${parsed.reason}`
          : parsed.reason,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to match use case", { error });
    return {
      matchedUseCase: null,
      suggestion:
        "I couldn't analyze use cases at this time. Try browsing the Use Case Studio directly.",
    };
  }
}

// ============================================================================
// ANALYTICS HANDLERS
// ============================================================================

/**
 * Get content performance insights
 */
export async function getContentPerformanceInsights(
  ctx: ContentCockpitContext,
  period: "7d" | "30d" | "90d" = "30d"
): Promise<ContentPerformanceInsight> {
  try {
    const periodDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(
      startDate.getTime() - periodDays * 24 * 60 * 60 * 1000
    );

    // Get current period stats
    const [currentStats] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        totalArticles: sql<number>`COUNT(DISTINCT ${articleAnalytics.postId})`,
      })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, ctx.workspaceId),
          gte(articleAnalytics.periodStart, startDate)
        )
      );

    // Get previous period stats for trend
    const [previousStats] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
      })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, ctx.workspaceId),
          gte(articleAnalytics.periodStart, previousStartDate),
          lte(articleAnalytics.periodEnd, startDate)
        )
      );

    // Get top performer
    const topPerformers = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
      })
      .from(blogPosts)
      .leftJoin(articleAnalytics, eq(articleAnalytics.postId, blogPosts.id))
      .where(
        and(
          eq(blogPosts.status, "published"),
          gte(articleAnalytics.periodStart, startDate)
        )
      )
      .groupBy(blogPosts.id, blogPosts.title)
      .orderBy(desc(sql`SUM(${articleAnalytics.totalViews})`))
      .limit(1);

    // Calculate trend
    const currentViews = Number(currentStats?.totalViews || 0);
    const previousViews = Number(previousStats?.totalViews || 0);
    const trend: "up" | "down" | "stable" =
      previousViews === 0
        ? "stable"
        : currentViews > previousViews * 1.1
        ? "up"
        : currentViews < previousViews * 0.9
        ? "down"
        : "stable";

    // Generate recommendation
    let recommendation = "";
    if (currentViews === 0) {
      recommendation =
        "No views recorded yet. Make sure analytics tracking is set up and start publishing content.";
    } else if (trend === "up") {
      recommendation =
        "Great job! Your content is getting more traction. Keep up the momentum by publishing consistently.";
    } else if (trend === "down") {
      recommendation =
        "Views are declining. Consider refreshing older content or exploring new topics from your hit list.";
    } else {
      recommendation =
        "Traffic is stable. Try promoting your best content on social media to boost engagement.";
    }

    return {
      totalViews: currentViews,
      totalArticles: Number(currentStats?.totalArticles || 0),
      topPerformer: topPerformers[0]
        ? {
            id: topPerformers[0].id,
            title: topPerformers[0].title || "Untitled",
            views: Number(topPerformers[0].totalViews),
          }
        : null,
      trend,
      recommendation,
    };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to get performance insights", {
      error,
    });
    return {
      totalViews: 0,
      totalArticles: 0,
      topPerformer: null,
      trend: "stable",
      recommendation: "Unable to analyze content performance at this time.",
    };
  }
}

/**
 * Get AI-powered content recommendations
 */
export async function getAIContentRecommendations(
  ctx: ContentCockpitContext
): Promise<ContentSuggestion[]> {
  try {
    const suggestions: ContentSuggestion[] = [];

    // Get hit list status
    const hitListInsight = await getWhatToWriteNext(ctx);

    if (hitListInsight.topPriority) {
      suggestions.push({
        type: "article",
        title: `Write: ${hitListInsight.topPriority.title}`,
        description: `This is your top priority topic with a score of ${hitListInsight.topPriority.score}. ${hitListInsight.topPriority.reason}`,
        action: {
          type: "navigate",
          target: `/admin/content/article-studio?topic=${hitListInsight.topPriority.id}`,
        },
        priority: 90,
      });
    } else if (hitListInsight.totalQueued === 0) {
      suggestions.push({
        type: "article",
        title: "Build Your Content Queue",
        description:
          "Your hit list is empty. Let me help you brainstorm some article topics.",
        action: {
          type: "navigate",
          target: "/admin/content/hit-list",
        },
        priority: 80,
      });
    }

    // Check for source suggestions
    const sourceSuggestions = await getSuggestedSources(ctx);
    if (sourceSuggestions.count > 0) {
      suggestions.push({
        type: "source",
        title: `${sourceSuggestions.count} New Source Suggestion${sourceSuggestions.count > 1 ? "s" : ""}`,
        description: `I found some new research sources for your content. Review them in Sources Hub.`,
        action: {
          type: "navigate",
          target: "/admin/content/sources?status=suggested",
        },
        priority: 70,
      });
    }

    // Get performance insights
    const performance = await getContentPerformanceInsights(ctx, "30d");
    if (performance.trend === "down") {
      suggestions.push({
        type: "insight",
        title: "Content Performance Declining",
        description: performance.recommendation,
        action: {
          type: "navigate",
          target: "/admin/content/analytics",
        },
        priority: 75,
      });
    }

    // Check for use cases without roadmaps
    const useCasesWithoutRoadmaps = await db
      .select({ id: useCases.id, name: useCases.name })
      .from(useCases)
      .where(
        and(
          eq(useCases.workspaceId, ctx.workspaceId),
          eq(useCases.status, "draft"),
          sql`jsonb_array_length(${useCases.roadmap}) = 0`
        )
      )
      .limit(3);

    if (useCasesWithoutRoadmaps.length > 0) {
      suggestions.push({
        type: "use_case",
        title: `Complete Use Case: ${useCasesWithoutRoadmaps[0].name}`,
        description:
          "This use case is missing a roadmap. Generate one to help guide new users.",
        action: {
          type: "navigate",
          target: `/admin/content/use-cases/${useCasesWithoutRoadmaps[0].id}`,
        },
        priority: 60,
      });
    }

    // Sort by priority and return top suggestions
    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
  } catch (error) {
    logger.error("[ContentCockpit] Failed to get AI recommendations", {
      error,
    });
    return [];
  }
}

// ============================================================================
// SMART SUGGESTIONS FOR NEPTUNE
// ============================================================================

/**
 * Get contextual suggestions based on current Content Cockpit state
 * Used by Neptune to provide proactive assistance
 */
export async function getContentCockpitSuggestions(
  ctx: ContentCockpitContext
): Promise<{
  suggestions: string[];
  alerts: Array<{ type: string; message: string; priority: number }>;
}> {
  const suggestions: string[] = [];
  const alerts: Array<{ type: string; message: string; priority: number }> = [];

  try {
    // Check hit list
    const hitListInsight = await getWhatToWriteNext(ctx);
    if (hitListInsight.totalQueued > 0) {
      suggestions.push(
        `Your hit list has ${hitListInsight.totalQueued} topics queued. Ask me "what should I write next?" for recommendations.`
      );
    }
    if (hitListInsight.inProgress > 2) {
      alerts.push({
        type: "warning",
        message: `You have ${hitListInsight.inProgress} articles in progress. Consider finishing one before starting new.`,
        priority: 7,
      });
    }

    // Check for source suggestions
    const sourceSuggestions = await getSuggestedSources(ctx);
    if (sourceSuggestions.count > 0) {
      suggestions.push(
        `I found ${sourceSuggestions.count} new source suggestions for your content research.`
      );
    }

    // Check performance
    const performance = await getContentPerformanceInsights(ctx, "7d");
    if (performance.trend === "up") {
      suggestions.push(
        `Your content views are up! ${performance.topPerformer ? `"${performance.topPerformer.title}" is performing well.` : ""}`
      );
    } else if (performance.trend === "down") {
      alerts.push({
        type: "opportunity",
        message:
          "Content views are declining. Ask me for optimization suggestions.",
        priority: 6,
      });
    }

    // Check unread alert badges
    const unreadAlerts = await db
      .select({ count: sql<number>`count(*)` })
      .from(alertBadges)
      .where(
        and(
          eq(alertBadges.workspaceId, ctx.workspaceId),
          eq(alertBadges.status, "unread")
        )
      );

    if (Number(unreadAlerts[0]?.count || 0) > 0) {
      suggestions.push(
        `You have ${unreadAlerts[0]?.count} unread alerts in your Content Cockpit.`
      );
    }

    return { suggestions, alerts };
  } catch (error) {
    logger.error("[ContentCockpit] Failed to get suggestions", { error });
    return { suggestions: [], alerts: [] };
  }
}

