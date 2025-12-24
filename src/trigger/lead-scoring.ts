import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { prospects } from "@/db/schema";
import { eq, and, isNull, or, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Lead Scoring Task
 * Calculates and updates lead scores based on various factors
 */
export const scoreLeadTask = task({
  id: "score-lead",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { prospectId: string; workspaceId: string }) => {
    const { prospectId, workspaceId } = payload;

    // Get the prospect
    const prospect = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!prospect) {
      return { success: false, error: "Prospect not found" };
    }

    // Calculate score based on various factors
    let score = 0;

    // Base score for having a record
    score += 10;

    // Email presence (+15)
    if (prospect.email) {
      score += 15;
      // Corporate email bonus (+10)
      if (!prospect.email.includes("gmail") && 
          !prospect.email.includes("yahoo") && 
          !prospect.email.includes("hotmail")) {
        score += 10;
      }
    }

    // Phone presence (+10)
    if (prospect.phone) {
      score += 10;
    }

    // Company name (+10)
    if (prospect.company) {
      score += 10;
    }

    // Job title (+10)
    if (prospect.title) {
      score += 10;
      // C-level/VP bonus (+15)
      const title = prospect.title.toLowerCase();
      if (title.includes("ceo") || title.includes("cto") || 
          title.includes("cfo") || title.includes("vp") || 
          title.includes("director") || title.includes("head of")) {
        score += 15;
      }
    }

    // Estimated value bonus
    if (prospect.estimatedValue) {
      if (prospect.estimatedValue >= 10000 * 100) score += 20; // $10k+
      else if (prospect.estimatedValue >= 5000 * 100) score += 15; // $5k+
      else if (prospect.estimatedValue >= 1000 * 100) score += 10; // $1k+
    }

    // Stage progression bonus
    const stageScores: Record<string, number> = {
      new: 0,
      contacted: 5,
      qualified: 15,
      proposal: 25,
      negotiation: 35,
      won: 50,
      lost: -10,
    };
    score += stageScores[prospect.stage] || 0;

    // Recent activity bonus
    if (prospect.lastContactedAt) {
      const daysSinceContact = Math.floor(
        (Date.now() - prospect.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceContact < 7) score += 10;
      else if (daysSinceContact < 30) score += 5;
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    // Update the prospect's score
    await db
      .update(prospects)
      .set({ 
        score, 
        updatedAt: new Date() 
      })
      .where(eq(prospects.id, prospectId));

    logger.info("Lead scored", { prospectId, score, workspaceId });

    return { success: true, prospectId, score };
  },
});

/**
 * Bulk Lead Scoring Task
 * Scores all leads in a workspace that haven't been scored recently
 */
export const bulkScoreLeadsTask = task({
  id: "bulk-score-leads",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;

    // Get all prospects that need scoring (no score or not updated in 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const prospectsToScore = await db.query.prospects.findMany({
      where: and(
        eq(prospects.workspaceId, workspaceId),
        or(
          isNull(prospects.score),
          lt(prospects.updatedAt, oneDayAgo)
        )
      ),
      limit: 100, // Process in batches
    });

    logger.info("Bulk scoring leads", { 
      workspaceId, 
      count: prospectsToScore.length 
    });

    if (prospectsToScore.length === 0) {
      return {
        success: true,
        processed: 0,
        results: [],
      };
    }

    // Use batchTriggerAndWait for efficient parallel processing
    // This is more efficient than Promise.all with multiple trigger() calls
    const batchResults = await scoreLeadTask.batchTriggerAndWait(
      prospectsToScore.map((prospect) => ({
        payload: {
          prospectId: prospect.id,
          workspaceId,
        },
      }))
    );

    // Process results
    const successful = batchResults.runs.filter((r) => r.ok);
    const failed = batchResults.runs.filter((r) => !r.ok);

    if (failed.length > 0) {
      logger.warn("Some lead scoring tasks failed", {
        workspaceId,
        failedCount: failed.length,
        errors: failed.map((r) => !r.ok && r.error),
      });
    }

    return {
      success: true,
      processed: prospectsToScore.length,
      successful: successful.length,
      failed: failed.length,
      results: successful.map((r) => r.ok && r.output),
    };
  },
});

/**
 * Scheduled Lead Scoring
 * Runs daily to ensure all leads have up-to-date scores
 */
export const scheduledLeadScoring = schedules.task({
  id: "scheduled-lead-scoring",
  cron: "0 2 * * *", // Run at 2 AM daily
  run: async () => {
    // Get all workspaces with active prospects
    const workspacesWithProspects = await db
      .selectDistinct({ workspaceId: prospects.workspaceId })
      .from(prospects);

    logger.info("Starting scheduled lead scoring", {
      workspaceCount: workspacesWithProspects.length,
    });

    if (workspacesWithProspects.length === 0) {
      return {
        success: true,
        workspacesProcessed: 0,
      };
    }

    // Use batchTrigger for fire-and-forget workspace scoring
    // We don't need to wait for results in the scheduled job
    // Use date-based idempotency keys to prevent duplicate daily runs
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    const batchHandle = await bulkScoreLeadsTask.batchTrigger(
      workspacesWithProspects.map((w) => ({
        payload: { workspaceId: w.workspaceId },
        options: {
          idempotencyKey: `scheduled-lead-scoring-${w.workspaceId}-${today}`,
          idempotencyKeyTTL: "24h",
          tags: [`workspace:${w.workspaceId}`, "type:scheduled-lead-scoring"],
        },
      }))
    );

    return {
      success: true,
      workspacesProcessed: workspacesWithProspects.length,
      batchTriggered: true,
    };
  },
});

