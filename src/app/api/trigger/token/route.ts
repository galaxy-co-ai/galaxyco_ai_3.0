import { NextResponse } from "next/server";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { auth } from "@trigger.dev/sdk/v3";
import { logger } from "@/lib/logger";

/**
 * POST: Generate a public access token for Trigger.dev Realtime
 * 
 * This endpoint creates a scoped token that allows the frontend
 * to subscribe to task run updates in real-time.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await clerkAuth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { runId, runIds, taskIds, tags } = body;

    // Build scopes based on what was requested
    const scopes: {
      read: {
        runs?: string[] | true;
        tasks?: string[];
        tags?: string[];
      };
    } = {
      read: {},
    };

    // Scope to specific run(s)
    if (runId) {
      scopes.read.runs = [runId];
    } else if (runIds && Array.isArray(runIds)) {
      scopes.read.runs = runIds;
    } else if (taskIds && Array.isArray(taskIds)) {
      // Scope to specific tasks
      scopes.read.tasks = taskIds;
    } else if (tags && Array.isArray(tags)) {
      // Scope to specific tags
      scopes.read.tags = tags;
    } else {
      // Default: no specific scopes (least privilege)
      return NextResponse.json(
        { error: "Must provide runId, runIds, taskIds, or tags" },
        { status: 400 }
      );
    }

    // Generate a public access token with the specified scopes
    const publicToken = await auth.createPublicToken({
      scopes,
      expirationTime: "1h",
    });

    logger.info("Generated public access token", {
      runId: runId || runIds?.[0],
      userId,
      hasTaskIds: !!taskIds,
      hasTags: !!tags,
    });

    return NextResponse.json({
      publicAccessToken: publicToken,
      runId,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    logger.error("Failed to generate public access token", { error });
    
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
