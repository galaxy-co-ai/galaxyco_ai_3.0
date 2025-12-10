/**
 * Hit List Priority Scoring Algorithm
 *
 * Calculates AI-powered priority scores for hit list items based on
 * multiple weighted factors. Total score is 0-100.
 *
 * Factors:
 * - Content Gap (0-20): How much this fills a gap in existing content
 * - Trending Score (0-20): Industry trend relevance
 * - Engagement Potential (0-20): Predicted reader interest
 * - Seasonality (0-15): Time-sensitive relevance
 * - Competitor Coverage (0-15): What competitors are writing
 * - User Sentiment (0-10): Positive signals from audience
 */

import { getOpenAI } from "@/lib/ai-providers";
import { logger } from "@/lib/logger";

export interface PriorityScoreBreakdown {
  contentGap: number;
  trendingScore: number;
  engagementPotential: number;
  seasonality: number;
  competitorCoverage: number;
  userSentiment: number;
  calculatedAt: string;
  reasoning?: {
    contentGap?: string;
    trendingScore?: string;
    engagementPotential?: string;
    seasonality?: string;
    competitorCoverage?: string;
    userSentiment?: string;
  };
}

export interface TopicForScoring {
  id: string;
  title: string;
  description: string | null;
  whyItWorks: string | null;
  category: string | null;
  targetPublishDate: Date | null;
}

export interface ExistingContent {
  title: string;
  category: string | null;
  publishedAt: Date | null;
}

export interface ScoringContext {
  existingContent: ExistingContent[];
  recentTopics: string[];
  industryContext?: string;
}

export interface ScoringResult {
  topicId: string;
  totalScore: number;
  breakdown: PriorityScoreBreakdown;
}

/**
 * Calculate priority scores for multiple topics using AI
 */
export async function calculatePriorityScores(
  topics: TopicForScoring[],
  context: ScoringContext
): Promise<ScoringResult[]> {
  if (topics.length === 0) {
    return [];
  }

  try {
    const openai = getOpenAI();

    // Build the AI prompt
    const systemPrompt = `You are a content strategist analyzing topics to prioritize for a content calendar. 
Your task is to score each topic on multiple factors that determine its priority.

SCORING FACTORS (total 100 points):
1. Content Gap (0-20): How much does this fill a gap in the existing content library?
2. Trending Score (0-20): How relevant is this to current industry trends?
3. Engagement Potential (0-20): How likely is this to attract and engage readers?
4. Seasonality (0-15): Is this timely based on the current date or target publish date?
5. Competitor Coverage (0-15): How important is it to cover what competitors are writing about?
6. User Sentiment (0-10): How positive are signals from the target audience about this topic?

Be objective and vary your scores. Not everything should be high priority.
Consider the target publish date when scoring seasonality.`;

    const existingContentSummary =
      context.existingContent.length > 0
        ? `Existing Content Library:\n${context.existingContent
            .map((c) => `- ${c.title} (${c.category || "uncategorized"})`)
            .join("\n")}`
        : "Existing Content Library: None (starting fresh)";

    const topicsToScore = topics
      .map(
        (t, i) => `${i + 1}. "${t.title}"
   Description: ${t.description || "No description"}
   Why It Works: ${t.whyItWorks || "Not specified"}
   Category: ${t.category || "Uncategorized"}
   Target Date: ${t.targetPublishDate ? new Date(t.targetPublishDate).toLocaleDateString() : "Not set"}`
      )
      .join("\n\n");

    const userPrompt = `Today's date: ${new Date().toLocaleDateString()}

${existingContentSummary}

${context.industryContext ? `Industry Context: ${context.industryContext}\n\n` : ""}

TOPICS TO SCORE:
${topicsToScore}

For each topic, provide scores and brief reasoning (1-2 sentences per factor).

Respond with a JSON object:
{
  "scores": [
    {
      "topicIndex": 1,
      "contentGap": number (0-20),
      "trendingScore": number (0-20),
      "engagementPotential": number (0-20),
      "seasonality": number (0-15),
      "competitorCoverage": number (0-15),
      "userSentiment": number (0-10),
      "reasoning": {
        "contentGap": "brief explanation",
        "trendingScore": "brief explanation",
        "engagementPotential": "brief explanation",
        "seasonality": "brief explanation",
        "competitorCoverage": "brief explanation",
        "userSentiment": "brief explanation"
      }
    }
  ]
}

Return ONLY valid JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(content) as {
      scores?: Array<{
        topicIndex: number;
        contentGap: number;
        trendingScore: number;
        engagementPotential: number;
        seasonality: number;
        competitorCoverage: number;
        userSentiment: number;
        reasoning?: {
          contentGap?: string;
          trendingScore?: string;
          engagementPotential?: string;
          seasonality?: string;
          competitorCoverage?: string;
          userSentiment?: string;
        };
      }>;
    };

    if (!parsed.scores || !Array.isArray(parsed.scores)) {
      throw new Error("Invalid response format");
    }

    // Map AI scores to results
    const results: ScoringResult[] = [];
    const now = new Date().toISOString();

    for (const score of parsed.scores) {
      const topicIndex = score.topicIndex - 1; // Convert 1-based to 0-based
      const topic = topics[topicIndex];

      if (!topic) {
        continue;
      }

      // Clamp scores to their valid ranges
      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, Math.round(value || 0)));

      const breakdown: PriorityScoreBreakdown = {
        contentGap: clamp(score.contentGap, 0, 20),
        trendingScore: clamp(score.trendingScore, 0, 20),
        engagementPotential: clamp(score.engagementPotential, 0, 20),
        seasonality: clamp(score.seasonality, 0, 15),
        competitorCoverage: clamp(score.competitorCoverage, 0, 15),
        userSentiment: clamp(score.userSentiment, 0, 10),
        calculatedAt: now,
        reasoning: score.reasoning,
      };

      const totalScore =
        breakdown.contentGap +
        breakdown.trendingScore +
        breakdown.engagementPotential +
        breakdown.seasonality +
        breakdown.competitorCoverage +
        breakdown.userSentiment;

      results.push({
        topicId: topic.id,
        totalScore,
        breakdown,
      });
    }

    // For any topics not scored by AI, return default scores
    for (const topic of topics) {
      if (!results.find((r) => r.topicId === topic.id)) {
        results.push({
          topicId: topic.id,
          totalScore: 50, // Default middle score
          breakdown: {
            contentGap: 10,
            trendingScore: 10,
            engagementPotential: 10,
            seasonality: 7,
            competitorCoverage: 7,
            userSentiment: 6,
            calculatedAt: now,
          },
        });
      }
    }

    return results;
  } catch (error) {
    logger.error("[HitListPrioritizer] Failed to calculate scores", { error });

    // Return default scores on error
    const now = new Date().toISOString();
    return topics.map((topic) => ({
      topicId: topic.id,
      totalScore: 50,
      breakdown: {
        contentGap: 10,
        trendingScore: 10,
        engagementPotential: 10,
        seasonality: 7,
        competitorCoverage: 7,
        userSentiment: 6,
        calculatedAt: now,
      },
    }));
  }
}

/**
 * Get priority color based on score
 */
export function getPriorityColor(score: number): string {
  if (score >= 80) return "emerald";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "gray";
}

/**
 * Get priority label based on score
 */
export function getPriorityLabel(score: number): string {
  if (score >= 80) return "High Priority";
  if (score >= 60) return "Medium-High";
  if (score >= 40) return "Medium";
  if (score >= 20) return "Low-Medium";
  return "Low Priority";
}

