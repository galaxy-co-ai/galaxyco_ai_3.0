import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { contentSources, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/content-sources/[id]
 *
 * Get a single content source by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid source ID format"), "Fetch content source");
    }

    const [source] = await db
      .select({
        id: contentSources.id,
        workspaceId: contentSources.workspaceId,
        name: contentSources.name,
        url: contentSources.url,
        description: contentSources.description,
        type: contentSources.type,
        status: contentSources.status,
        aiReviewScore: contentSources.aiReviewScore,
        aiReviewNotes: contentSources.aiReviewNotes,
        aiReviewedAt: contentSources.aiReviewedAt,
        lastCheckedAt: contentSources.lastCheckedAt,
        articlesFoundCount: contentSources.articlesFoundCount,
        tags: contentSources.tags,
        addedBy: contentSources.addedBy,
        createdAt: contentSources.createdAt,
        updatedAt: contentSources.updatedAt,
        addedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(contentSources)
      .leftJoin(users, eq(contentSources.addedBy, users.id))
      .where(
        and(
          eq(contentSources.id, id),
          eq(contentSources.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!source) {
      return createErrorResponse(new Error("Source not found"), "Fetch content source");
    }

    return NextResponse.json({ source });
  } catch (error) {
    return createErrorResponse(error, "Fetch content source");
  }
}

/**
 * PATCH /api/admin/content-sources/[id]
 *
 * Update a content source.
 */
const updateSourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2000).optional(),
  description: z.string().max(1000).optional().nullable(),
  type: z
    .enum(["news", "research", "competitor", "inspiration", "industry", "other"])
    .optional(),
  status: z.enum(["active", "suggested", "rejected", "archived"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  aiReviewScore: z.number().int().min(0).max(100).optional().nullable(),
  aiReviewNotes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid source ID format"), "Update content source");
    }

    const body = await request.json();
    const validatedData = updateSourceSchema.parse(body);

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.url !== undefined) updateData.url = validatedData.url;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.aiReviewScore !== undefined) {
      updateData.aiReviewScore = validatedData.aiReviewScore;
      updateData.aiReviewedAt = validatedData.aiReviewScore ? new Date() : null;
    }
    if (validatedData.aiReviewNotes !== undefined)
      updateData.aiReviewNotes = validatedData.aiReviewNotes;

    // Check if URL is being updated and already exists
    if (validatedData.url) {
      const existingSource = await db
        .select({ id: contentSources.id })
        .from(contentSources)
        .where(
          and(
            eq(contentSources.workspaceId, workspaceId),
            eq(contentSources.url, validatedData.url)
          )
        )
        .limit(1);

      if (existingSource.length > 0 && existingSource[0].id !== id) {
        return createErrorResponse(new Error("A source with this URL already exists"), "Update content source");
      }
    }

    const [updatedSource] = await db
      .update(contentSources)
      .set(updateData)
      .where(
        and(
          eq(contentSources.id, id),
          eq(contentSources.workspaceId, workspaceId)
        )
      )
      .returning();

    if (!updatedSource) {
      return createErrorResponse(new Error("Source not found"), "Update content source");
    }

    logger.info("Content source updated", {
      sourceId: id,
      changes: Object.keys(validatedData),
    });

    return NextResponse.json({ source: updatedSource });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid request body"), "Update content source");
    }
    return createErrorResponse(error, "Update content source");
  }
}

/**
 * DELETE /api/admin/content-sources/[id]
 *
 * Delete a content source.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid source ID format"), "Delete content source");
    }

    const [deletedSource] = await db
      .delete(contentSources)
      .where(
        and(
          eq(contentSources.id, id),
          eq(contentSources.workspaceId, workspaceId)
        )
      )
      .returning({ id: contentSources.id });

    if (!deletedSource) {
      return createErrorResponse(new Error("Source not found"), "Delete content source");
    }

    logger.info("Content source deleted", { sourceId: id });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return createErrorResponse(error, "Delete content source");
  }
}

