/**
 * Trigger.dev Queue Configurations
 * 
 * Defines queues for per-tenant concurrency management.
 * Different subscription tiers get different concurrency limits.
 */

import { queue } from "@trigger.dev/sdk/v3";

// ============================================================================
// TIER-BASED QUEUES
// ============================================================================

/**
 * Free tier queue - very limited concurrency
 * Used for free/trial workspaces
 */
export const freeTierQueue = queue({
  name: "free-tier",
  concurrencyLimit: 1, // Only 1 concurrent task per workspace
});

/**
 * Standard tier queue - moderate concurrency
 * Used for paid starter/standard plans
 */
export const standardTierQueue = queue({
  name: "standard-tier",
  concurrencyLimit: 5, // 5 concurrent tasks per workspace
});

/**
 * Enterprise tier queue - high concurrency
 * Used for enterprise/unlimited plans
 */
export const enterpriseTierQueue = queue({
  name: "enterprise-tier",
  concurrencyLimit: 20, // 20 concurrent tasks per workspace
});

/**
 * System jobs queue - for internal operations
 * Not tied to any workspace tier
 */
export const systemJobsQueue = queue({
  name: "system-jobs",
  concurrencyLimit: 10, // 10 concurrent system tasks
});

// ============================================================================
// QUEUE SELECTION HELPERS
// ============================================================================

/**
 * Workspace subscription tiers
 */
export type WorkspaceTier = "free" | "starter" | "standard" | "professional" | "enterprise";

/**
 * Get the appropriate queue for a workspace tier
 */
export function getQueueForTier(tier: WorkspaceTier) {
  switch (tier) {
    case "free":
      return freeTierQueue;
    case "starter":
    case "standard":
      return standardTierQueue;
    case "professional":
    case "enterprise":
      return enterpriseTierQueue;
    default:
      return freeTierQueue; // Default to free tier for safety
  }
}

/**
 * Get queue name for a workspace tier (for use in trigger options)
 */
export function getQueueNameForTier(tier: WorkspaceTier): string {
  switch (tier) {
    case "free":
      return "free-tier";
    case "starter":
    case "standard":
      return "standard-tier";
    case "professional":
    case "enterprise":
      return "enterprise-tier";
    default:
      return "free-tier";
  }
}

/**
 * Get concurrency limit for a workspace tier
 */
export function getConcurrencyLimitForTier(tier: WorkspaceTier): number {
  switch (tier) {
    case "free":
      return 1;
    case "starter":
    case "standard":
      return 5;
    case "professional":
    case "enterprise":
      return 20;
    default:
      return 1;
  }
}

/**
 * Build trigger options for a workspace-scoped task
 * 
 * @param workspaceId - The workspace ID (used as concurrency key)
 * @param tier - The workspace's subscription tier
 * @returns Trigger options with queue and concurrency key configured
 * 
 * @example
 * await myTask.trigger(payload, {
 *   ...buildWorkspaceQueueOptions("ws_123", "standard"),
 *   tags: ["workspace:ws_123"],
 * });
 */
export function buildWorkspaceQueueOptions(workspaceId: string, tier: WorkspaceTier) {
  return {
    queue: {
      name: getQueueNameForTier(tier),
      concurrencyLimit: getConcurrencyLimitForTier(tier),
    },
    concurrencyKey: workspaceId,
  };
}
