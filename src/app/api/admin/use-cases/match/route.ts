import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { useCases } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * POST /api/admin/use-cases/match
 *
 * Match user onboarding answers to the best use case template.
 * Returns the matched use case's pre-built roadmap.
 */
const matchRequestSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedOption: z.string().max(200),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = matchRequestSchema.parse(body);

    // Get all published use cases with onboarding questions
    const publishedUseCases = await db
      .select()
      .from(useCases)
      .where(
        and(
          eq(useCases.workspaceId, workspaceId),
          eq(useCases.status, "published")
        )
      );

    if (publishedUseCases.length === 0) {
      return createErrorResponse(new Error("No published use cases not found for matching"), "Match use case");
    }

    // Calculate match scores for each use case
    const scores = publishedUseCases.map((useCase) => {
      let score = 0;
      let maxPossibleScore = 0;

      const questions = useCase.onboardingQuestions || [];

      // For each question the user answered
      validatedData.answers.forEach((answer) => {
        const question = questions[answer.questionIndex];
        if (!question) return;

        maxPossibleScore += question.matchingWeight;

        // Check if the selected option matches one of the options
        const optionIndex = question.options.indexOf(answer.selectedOption);
        if (optionIndex !== -1) {
          // First option typically has highest relevance
          // Score decreases for later options
          const optionWeight = 1 - (optionIndex * 0.2);
          score += question.matchingWeight * Math.max(0.2, optionWeight);
        }
      });

      // Normalize score to 0-100
      const normalizedScore = maxPossibleScore > 0
        ? Math.round((score / maxPossibleScore) * 100)
        : 0;

      return {
        useCase,
        score: normalizedScore,
      };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    // Get the best match
    const bestMatch = scores[0];

    if (!bestMatch || bestMatch.score === 0) {
      // Return the first published use case as fallback
      const fallback = publishedUseCases[0];
      return NextResponse.json({
        matched: true,
        useCase: {
          id: fallback.id,
          name: fallback.name,
          description: fallback.description,
          category: fallback.category,
          roadmap: fallback.roadmap,
        },
        matchScore: 0,
        isFallback: true,
      });
    }

    logger.info("Use case matched", {
      useCaseId: bestMatch.useCase.id,
      matchScore: bestMatch.score,
      answersCount: validatedData.answers.length,
    });

    return NextResponse.json({
      matched: true,
      useCase: {
        id: bestMatch.useCase.id,
        name: bestMatch.useCase.name,
        description: bestMatch.useCase.description,
        category: bestMatch.useCase.category,
        roadmap: bestMatch.useCase.roadmap,
      },
      matchScore: bestMatch.score,
      isFallback: false,
      // Include alternatives if scores are close
      alternatives: scores.slice(1, 4).map((s) => ({
        id: s.useCase.id,
        name: s.useCase.name,
        category: s.useCase.category,
        score: s.score,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, "Match use case error");
  }
}

