import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getOpenAI } from "@/lib/ai-providers";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/admin/ai/sources/review
 *
 * AI reviews a source URL for quality, relevance, and authority.
 * Returns a confidence score (0-100) and detailed notes.
 */

const reviewSourceSchema = z.object({
  url: z.string().url("Invalid URL format").max(2000),
  workspaceContext: z
    .object({
      industry: z.string().optional(),
      topics: z.array(z.string()).optional(),
      existingSourceUrls: z.array(z.string()).optional(),
    })
    .optional(),
});

interface AIReviewResult {
  score: number;
  quality: {
    score: number;
    notes: string;
  };
  relevance: {
    score: number;
    notes: string;
  };
  authority: {
    score: number;
    notes: string;
  };
  overallNotes: string;
  suggestedType:
    | "news"
    | "research"
    | "competitor"
    | "inspiration"
    | "industry"
    | "other";
  suggestedTags: string[];
  warnings: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, workspace } = await getCurrentWorkspace();

    // Rate limit: 30 reviews per minute per workspace
    const rateLimitResult = await rateLimit(
      `source-review:${workspaceId}`,
      30,
      60
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = reviewSourceSchema.parse(body);

    const { url, workspaceContext } = validatedData;

    // Build the AI prompt
    const systemPrompt = `You are a content source quality analyst. Your job is to evaluate websites and URLs as potential content research sources. You will analyze the quality, relevance, and authority of the source.

For each source, you must evaluate:

1. **Quality (0-100)**: Is this a well-maintained, professional source?
   - Consider: Site design, content freshness, professional presentation, no spam
   - Look at: Domain reputation, content quality, update frequency

2. **Relevance (0-100)**: Does this source provide useful content for research?
   - Consider: Topic coverage, depth of content, practical usefulness
   - Look at: Category alignment, content type, target audience

3. **Authority (0-100)**: Is this source trustworthy and authoritative?
   - Consider: Domain authority, author credentials, citations/references
   - Look at: Industry recognition, longevity, expert opinions

The overall score should be a weighted average: Quality (30%), Relevance (40%), Authority (30%)

Also determine:
- Type: news, research, competitor, inspiration, industry, or other
- Suggested tags (up to 5)
- Any warnings (paywalls, outdated content, bias concerns, etc.)`;

    const userPrompt = `Analyze this URL as a potential content research source:

URL: ${url}

${
  workspaceContext?.industry
    ? `Workspace Industry: ${workspaceContext.industry}`
    : ""
}
${
  workspaceContext?.topics?.length
    ? `Focus Topics: ${workspaceContext.topics.join(", ")}`
    : ""
}

Based on the URL structure and domain, evaluate this source. Respond with a JSON object:

{
  "score": number (0-100, overall weighted score),
  "quality": {
    "score": number (0-100),
    "notes": "Brief explanation"
  },
  "relevance": {
    "score": number (0-100),
    "notes": "Brief explanation"
  },
  "authority": {
    "score": number (0-100),
    "notes": "Brief explanation"
  },
  "overallNotes": "Summary of the source and its value",
  "suggestedType": "news|research|competitor|inspiration|industry|other",
  "suggestedTags": ["tag1", "tag2"],
  "warnings": ["any concerns or caveats"]
}

Return ONLY valid JSON.`;

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    let parsed: AIReviewResult;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logger.error("Failed to parse AI response", parseError, { content });
      throw new Error("Failed to parse AI response");
    }

    // Validate and sanitize the response
    const result: AIReviewResult = {
      score: Math.min(100, Math.max(0, Math.round(parsed.score || 50))),
      quality: {
        score: Math.min(100, Math.max(0, Math.round(parsed.quality?.score || 50))),
        notes: String(parsed.quality?.notes || "").slice(0, 500),
      },
      relevance: {
        score: Math.min(100, Math.max(0, Math.round(parsed.relevance?.score || 50))),
        notes: String(parsed.relevance?.notes || "").slice(0, 500),
      },
      authority: {
        score: Math.min(100, Math.max(0, Math.round(parsed.authority?.score || 50))),
        notes: String(parsed.authority?.notes || "").slice(0, 500),
      },
      overallNotes: String(parsed.overallNotes || "").slice(0, 1000),
      suggestedType: ["news", "research", "competitor", "inspiration", "industry", "other"].includes(
        parsed.suggestedType
      )
        ? (parsed.suggestedType as AIReviewResult["suggestedType"])
        : "other",
      suggestedTags: Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags.filter((t): t is string => typeof t === "string").slice(0, 5)
        : [],
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.filter((w): w is string => typeof w === "string").slice(0, 5)
        : [],
    };

    logger.info("AI source review completed", {
      url,
      score: result.score,
      workspaceId,
    });

    return NextResponse.json({
      review: result,
      url,
      isRecommended: result.score >= 70,
    });
  } catch (error) {
    logger.error("Failed to review source", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "AI service not configured. Please add your OpenAI API key." },
        { status: 503 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to review source. Please try again." },
      { status: 500 }
    );
  }
}

