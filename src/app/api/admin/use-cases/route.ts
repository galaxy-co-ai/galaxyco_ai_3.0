import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { useCases, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";

/**
 * GET /api/admin/use-cases
 *
 * List use cases for the current workspace.
 * Supports filtering by status and search.
 *
 * Query params:
 * - status: Filter by status (draft, complete, published, archived)
 * - search: Search by name or description
 * - limit: Max number of results (default 50)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "draft"
      | "complete"
      | "published"
      | "archived"
      | null;
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [eq(useCases.workspaceId, workspaceId)];

    if (status) {
      conditions.push(eq(useCases.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(useCases.name, `%${search}%`),
          ilike(useCases.description, `%${search}%`)
        ) ?? sql`true`
      );
    }

    // Fetch use cases with creator info
    const items = await db
      .select({
        id: useCases.id,
        workspaceId: useCases.workspaceId,
        name: useCases.name,
        description: useCases.description,
        category: useCases.category,
        status: useCases.status,
        personas: useCases.personas,
        platformTools: useCases.platformTools,
        journeyStages: useCases.journeyStages,
        messaging: useCases.messaging,
        onboardingQuestions: useCases.onboardingQuestions,
        roadmap: useCases.roadmap,
        createdBy: useCases.createdBy,
        publishedAt: useCases.publishedAt,
        createdAt: useCases.createdAt,
        updatedAt: useCases.updatedAt,
        createdByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(useCases)
      .leftJoin(users, eq(useCases.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(useCases.updatedAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(useCases)
      .where(and(...conditions));

    // Get counts by status for quick stats
    const statusCounts = await db
      .select({
        status: useCases.status,
        count: sql<number>`count(*)`,
      })
      .from(useCases)
      .where(eq(useCases.workspaceId, workspaceId))
      .groupBy(useCases.status);

    const stats = {
      draft: 0,
      complete: 0,
      published: 0,
      archived: 0,
    };

    statusCounts.forEach((row) => {
      stats[row.status as keyof typeof stats] = Number(row.count);
    });

    return NextResponse.json({
      useCases: items,
      total: Number(countResult?.count || 0),
      stats,
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Failed to fetch use cases", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch use cases" },
      { status: 500 }
    );
  }
}

// Zod schemas for persona and journey validation
const personaSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().max(200).optional().default(""),
  goals: z.array(z.string().max(300)).max(10).optional().default([]),
  painPoints: z.array(z.string().max(300)).max(10).optional().default([]),
});

const journeyStageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  actions: z.array(z.string().max(300)).max(10).optional().default([]),
  tools: z.array(z.string().max(100)).max(10).optional().default([]),
});

const messagingSchema = z.object({
  tagline: z.string().max(200).optional(),
  valueProposition: z.string().max(1000).optional(),
  targetChannels: z.array(z.string().max(100)).max(10).optional(),
});

const onboardingQuestionSchema = z.object({
  question: z.string().min(1).max(300),
  options: z.array(z.string().max(200)).min(2).max(6),
  matchingWeight: z.number().int().min(0).max(100).default(50),
});

/**
 * POST /api/admin/use-cases
 *
 * Create a new use case (starts as draft).
 */
const createUseCaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  category: z
    .enum([
      "b2b_saas",
      "b2c_app",
      "agency",
      "enterprise",
      "solopreneur",
      "ecommerce",
      "creator",
      "consultant",
      "internal_team",
      "other",
    ])
    .default("other"),
  personas: z.array(personaSchema).max(5).optional(),
  platformTools: z.array(z.string().max(100)).max(50).optional(),
  journeyStages: z.array(journeyStageSchema).max(10).optional(),
  messaging: messagingSchema.optional(),
  onboardingQuestions: z.array(onboardingQuestionSchema).max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = createUseCaseSchema.parse(body);

    const [newUseCase] = await db
      .insert(useCases)
      .values({
        workspaceId,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        status: "draft",
        personas: validatedData.personas || [],
        platformTools: validatedData.platformTools || [],
        journeyStages: validatedData.journeyStages || [],
        messaging: validatedData.messaging || null,
        onboardingQuestions: validatedData.onboardingQuestions || [],
        roadmap: [],
        createdBy: user?.id || null,
      })
      .returning();

    logger.info("Use case created", {
      useCaseId: newUseCase.id,
      name: newUseCase.name,
      workspaceId,
    });

    return NextResponse.json({ useCase: newUseCase }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create use case", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create use case" },
      { status: 500 }
    );
  }
}

