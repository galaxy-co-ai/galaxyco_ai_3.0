import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentSources } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/admin/content-sources/suggestions
 *
 * Get AI-suggested content sources for the current workspace.
 * These are sources in the 'suggested' status that were discovered
 * by the AI and are awaiting user review.
 *
 * Query params:
 * - limit: Max number of results (default 20)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch suggested sources, ordered by AI score (highest first)
    const suggestions = await db
      .select()
      .from(contentSources)
      .where(
        and(
          eq(contentSources.workspaceId, workspaceId),
          eq(contentSources.status, "suggested")
        )
      )
      .orderBy(desc(contentSources.aiReviewScore), desc(contentSources.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count of suggestions
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentSources)
      .where(
        and(
          eq(contentSources.workspaceId, workspaceId),
          eq(contentSources.status, "suggested")
        )
      );

    return NextResponse.json({
      suggestions,
      total: Number(countResult?.count || 0),
      limit,
      offset,
    });
  } catch (error) {
    logger.error("Failed to fetch source suggestions", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch source suggestions" },
      { status: 500 }
    );
  }
}

