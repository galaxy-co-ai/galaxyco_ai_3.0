/**
 * Content Source Discovery Job
 *
 * Runs weekly to discover new content sources for workspaces
 * based on their existing sources and topic ideas.
 */

import { schedules, task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { workspaces, contentSources, topicIdeas, alertBadges } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getOpenAI } from "@/lib/ai-providers";

// ============================================================================
// TYPES
// ============================================================================

interface DiscoveredSource {
  name: string;
  url: string;
  description: string;
  type: "news" | "research" | "competitor" | "inspiration" | "industry" | "other";
  relevanceScore: number;
  reason: string;
  suggestedTags: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function discoverSourcesForWorkspace(workspaceId: string): Promise<DiscoveredSource[]> {
  // Get existing sources
  const existingSources = await db
    .select({ url: contentSources.url, name: contentSources.name, type: contentSources.type })
    .from(contentSources)
    .where(
      and(
        eq(contentSources.workspaceId, workspaceId),
        ne(contentSources.status, "rejected")
      )
    )
    .limit(30);

  // Get recent topic ideas for context
  const recentTopics = await db
    .select({ title: topicIdeas.title, description: topicIdeas.description })
    .from(topicIdeas)
    .where(eq(topicIdeas.workspaceId, workspaceId))
    .limit(20);

  if (existingSources.length === 0 && recentTopics.length === 0) {
    // No context to work with
    return [];
  }

  // Build the AI prompt
  const systemPrompt = `You are a content research specialist. Your job is to discover valuable content sources for research and inspiration. You suggest real, existing websites that are well-known and reputable.

When suggesting sources, consider:
1. **Relevance**: Must align with the user's topics and focus areas
2. **Quality**: Well-maintained, professional sources
3. **Authority**: Recognized experts or established platforms
4. **Diversity**: Mix of different types (news, research, industry blogs, etc.)

IMPORTANT: Only suggest REAL websites that actually exist. Do not make up URLs.`;

  const existingUrls = existingSources.map((s) => s.url).join("\n- ");
  const sourceTypes = [...new Set(existingSources.map((s) => s.type))].join(", ");
  const topicsList = recentTopics
    .map((t) => `- ${t.title}${t.description ? `: ${t.description.substring(0, 100)}` : ""}`)
    .join("\n");

  const userPrompt = `Discover 5 valuable content sources for research and inspiration.

${
  topicsList
    ? `Topics of Interest:
${topicsList}`
    : ""
}

${
  sourceTypes
    ? `Current source types: ${sourceTypes}`
    : ""
}

${
  existingUrls
    ? `Existing Sources (DO NOT suggest duplicates or very similar sites):
- ${existingUrls}`
    : ""
}

Find sources that would complement the existing collection and help with research on the listed topics.

Respond with a JSON object containing an array of discovered sources:

{
  "sources": [
    {
      "name": "Source Name",
      "url": "https://actual-website.com",
      "description": "What this source covers and why it's valuable",
      "type": "news|research|competitor|inspiration|industry|other",
      "relevanceScore": number (0-100),
      "reason": "Why this source is recommended",
      "suggestedTags": ["tag1", "tag2"]
    }
  ]
}

IMPORTANT: Only suggest real, well-known websites that actually exist. Return ONLY valid JSON.`;

  try {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as { sources?: DiscoveredSource[] };

    // Validate and filter sources
    const validTypes = [
      "news",
      "research",
      "competitor",
      "inspiration",
      "industry",
      "other",
    ] as const;

    const existingUrlsLower = existingSources.map((s) =>
      s.url.toLowerCase().replace(/\/$/, "")
    );

    return (parsed.sources || [])
      .filter(
        (s): s is DiscoveredSource =>
          typeof s === "object" &&
          s !== null &&
          typeof s.name === "string" &&
          typeof s.url === "string" &&
          s.url.startsWith("http")
      )
      .filter((s) => {
        // Filter out duplicates
        const normalizedUrl = s.url.toLowerCase().replace(/\/$/, "");
        return !existingUrlsLower.some(
          (existing) =>
            existing === normalizedUrl ||
            existing.includes(new URL(s.url).hostname) ||
            normalizedUrl.includes(new URL(existingSources[0]?.url || "https://example.com").hostname)
        );
      })
      .map((s) => ({
        name: String(s.name).slice(0, 200),
        url: String(s.url).slice(0, 2000),
        description: String(s.description || "").slice(0, 1000),
        type: validTypes.includes(s.type as (typeof validTypes)[number])
          ? (s.type as DiscoveredSource["type"])
          : "other",
        relevanceScore: Math.min(100, Math.max(0, Math.round(s.relevanceScore || 50))),
        reason: String(s.reason || "").slice(0, 500),
        suggestedTags: Array.isArray(s.suggestedTags)
          ? s.suggestedTags.filter((t): t is string => typeof t === "string").slice(0, 5)
          : [],
      }))
      .slice(0, 5);
  } catch (error) {
    logger.error("[SourceDiscovery] AI request failed", { workspaceId, error });
    return [];
  }
}

// ============================================================================
// TRIGGER.DEV TASKS
// ============================================================================

/**
 * Discover sources for a single workspace
 */
export const discoverWorkspaceSourcesTask = task({
  id: "discover-workspace-sources",
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;

    logger.info("[SourceDiscovery] Starting discovery for workspace", { workspaceId });

    try {
      // Discover new sources
      const discoveredSources = await discoverSourcesForWorkspace(workspaceId);

      if (discoveredSources.length === 0) {
        logger.info("[SourceDiscovery] No new sources discovered", { workspaceId });
        return { success: true, sourcesAdded: 0 };
      }

      // Add sources as suggestions
      let addedCount = 0;
      for (const source of discoveredSources) {
        try {
          // Check if URL already exists
          const existing = await db
            .select({ id: contentSources.id })
            .from(contentSources)
            .where(
              and(
                eq(contentSources.workspaceId, workspaceId),
                eq(contentSources.url, source.url)
              )
            )
            .limit(1);

          if (existing.length > 0) {
            continue; // Skip duplicate
          }

          await db.insert(contentSources).values({
            workspaceId,
            name: source.name,
            url: source.url,
            description: source.description,
            type: source.type,
            status: "suggested",
            tags: source.suggestedTags,
            aiReviewScore: source.relevanceScore,
            aiReviewNotes: source.reason,
            aiReviewedAt: new Date(),
          });
          addedCount++;
        } catch (error) {
          logger.error("[SourceDiscovery] Failed to add source", {
            workspaceId,
            source: source.name,
            error,
          });
        }
      }

      // Create alert badge if sources were added
      if (addedCount > 0) {
        await db.insert(alertBadges).values({
          workspaceId,
          type: "suggestion",
          status: "unread",
          title: `${addedCount} New Source Suggestion${addedCount !== 1 ? "s" : ""}`,
          message: `We found ${addedCount} new content source${addedCount !== 1 ? "s" : ""} that might be valuable for your research. Review them in the Sources Hub.`,
          actionLabel: "Review Sources",
          actionUrl: "/admin/content/sources",
          priority: 50,
        });
      }

      logger.info("[SourceDiscovery] Discovery complete", {
        workspaceId,
        sourcesAdded: addedCount,
      });

      return { success: true, sourcesAdded: addedCount };
    } catch (error) {
      logger.error("[SourceDiscovery] Discovery failed", { workspaceId, error });
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Weekly scheduled job to discover sources for all workspaces
 * Runs every Monday at 9 AM UTC
 */
export const scheduledSourceDiscovery = schedules.task({
  id: "scheduled-source-discovery",
  // Run every Monday at 9 AM UTC
  cron: "0 9 * * 1",
  run: async () => {
    logger.info("[SourceDiscovery] Starting weekly source discovery");

    try {
      // Get all workspaces that have at least one source or topic idea
      const activeWorkspaces = await db
        .selectDistinct({ id: workspaces.id })
        .from(workspaces)
        .leftJoin(contentSources, eq(contentSources.workspaceId, workspaces.id))
        .leftJoin(topicIdeas, eq(topicIdeas.workspaceId, workspaces.id));

      logger.info("[SourceDiscovery] Processing workspaces", {
        count: activeWorkspaces.length,
      });

      let processed = 0;
      let failed = 0;

      // Process each workspace
      for (const workspace of activeWorkspaces) {
        try {
          await discoverWorkspaceSourcesTask.trigger({
            workspaceId: workspace.id,
          });
          processed++;
        } catch (error) {
          logger.error("[SourceDiscovery] Failed to trigger for workspace", {
            workspaceId: workspace.id,
            error,
          });
          failed++;
        }
      }

      logger.info("[SourceDiscovery] Weekly discovery complete", {
        processed,
        failed,
      });

      return { processed, failed };
    } catch (error) {
      logger.error("[SourceDiscovery] Weekly discovery failed", { error });
      throw error;
    }
  },
});

