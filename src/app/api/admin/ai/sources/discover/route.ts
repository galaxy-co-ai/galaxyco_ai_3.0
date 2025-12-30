import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getOpenAI } from "@/lib/ai-providers";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { contentSources, topicIdeas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * POST /api/admin/ai/sources/discover
 *
 * AI discovers new content sources based on workspace topics and existing sources.
 * Returns a list of suggested sources with review scores.
 */

const discoverSourcesSchema = z.object({
  count: z.number().int().min(1).max(10).default(5),
  focus: z.string().max(200).optional(),
  excludeTypes: z
    .array(z.enum(["news", "research", "competitor", "inspiration", "industry", "other"]))
    .optional(),
});

interface DiscoveredSource {
  name: string;
  url: string;
  description: string;
  type: "news" | "research" | "competitor" | "inspiration" | "industry" | "other";
  relevanceScore: number;
  reason: string;
  suggestedTags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, workspace } = await getCurrentWorkspace();

    // Rate limit: 10 discovery requests per minute per workspace
    const rateLimitResult = await rateLimit(
      `source-discover:${workspaceId}`,
      10,
      60
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = discoverSourcesSchema.parse(body);

    const { count, focus, excludeTypes } = validatedData;

    // Get existing sources to avoid duplicates
    const existingSources = await db
      .select({ url: contentSources.url, name: contentSources.name })
      .from(contentSources)
      .where(eq(contentSources.workspaceId, workspaceId))
      .limit(50);

    // Get recent topic ideas for context
    const recentTopics = await db
      .select({ title: topicIdeas.title, description: topicIdeas.description })
      .from(topicIdeas)
      .where(eq(topicIdeas.workspaceId, workspaceId))
      .limit(20);

    // Build the AI prompt
    const systemPrompt = `You are a content research specialist. Your job is to discover valuable content sources for research and inspiration. You suggest real, existing websites that are well-known and reputable.

When suggesting sources, consider:
1. **Relevance**: Must align with the user's topics and focus areas
2. **Quality**: Well-maintained, professional sources
3. **Authority**: Recognized experts or established platforms
4. **Diversity**: Mix of different types (news, research, industry blogs, etc.)

IMPORTANT: Only suggest REAL websites that actually exist. Do not make up URLs.`;

    const existingUrls = existingSources.map((s) => s.url).join("\n- ");
    const topicsList = recentTopics
      .map((t) => `- ${t.title}${t.description ? `: ${t.description}` : ""}`)
      .join("\n");

    const userPrompt = `Discover ${count} valuable content sources for research and inspiration.

Workspace: ${workspace.name}
${focus ? `Focus Area: ${focus}` : ""}

${
  topicsList
    ? `Recent Topics of Interest:
${topicsList}`
    : ""
}

${
  existingUrls
    ? `Existing Sources (DO NOT suggest duplicates):
- ${existingUrls}`
    : ""
}

${
  excludeTypes?.length
    ? `Exclude These Types: ${excludeTypes.join(", ")}`
    : ""
}

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

    let parsed: { sources?: DiscoveredSource[] };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logger.error("Failed to parse AI response", parseError, { content });
      throw new Error("Failed to parse AI response");
    }

    // Validate and sanitize the sources
    const validTypes = [
      "news",
      "research",
      "competitor",
      "inspiration",
      "industry",
      "other",
    ] as const;

    const sources: DiscoveredSource[] = (parsed.sources || [])
      .filter(
        (s): s is DiscoveredSource =>
          typeof s === "object" &&
          s !== null &&
          typeof s.name === "string" &&
          typeof s.url === "string"
      )
      .filter((s) => {
        // Exclude duplicates with existing sources
        const normalizedUrl = s.url.toLowerCase().replace(/\/$/, "");
        return !existingSources.some(
          (existing) =>
            existing.url.toLowerCase().replace(/\/$/, "") === normalizedUrl
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
      .slice(0, count);

    logger.info("AI source discovery completed", {
      count: sources.length,
      focus,
      workspaceId,
    });

    return NextResponse.json({
      sources,
      count: sources.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid request body"), "Discover sources");
    }
    return createErrorResponse(error, "Discover sources");
  }
}

