/**
 * Trigger.dev Background Jobs
 * 
 * This file exports all background jobs for the application.
 * Jobs are automatically discovered by Trigger.dev from this directory.
 * 
 * Features:
 * - Realtime streams for live AI output
 * - Per-tenant queues for concurrency control
 * - Batch APIs for bulk operations
 * - Wait functions (wait.for, wait.until, wait.forToken)
 * - Human-in-the-loop approvals
 * - Tags for observability
 */

// ============================================================================
// REALTIME STREAMS
// ============================================================================

export {
  agentOutputStream,
  campaignProgressStream,
  batchProgressStream,
  type AgentOutputPart,
  type CampaignProgressPart,
  type BatchProgressPart,
  type STREAMS,
} from "./streams";

// ============================================================================
// PER-TENANT QUEUES
// ============================================================================

export {
  freeTierQueue,
  standardTierQueue,
  enterpriseTierQueue,
  systemJobsQueue,
  getQueueForTier,
  getQueueNameForTier,
  getConcurrencyLimitForTier,
  buildWorkspaceQueueOptions,
} from "./queues";

// ============================================================================
// HUMAN-IN-THE-LOOP APPROVALS
// ============================================================================

export {
  requestApprovalTask,
  completeApproval,
  type ApprovalPayload,
  type ApprovalResult,
  type ApprovalType,
} from "./approvals";

// ============================================================================
// FOLLOW-UP SEQUENCES
// ============================================================================

export {
  executeFollowUpSequenceTask,
  sendDelayedFollowUpTask,
  type FollowUpStep,
  type FollowUpSequencePayload,
  type FollowUpResult,
} from "./follow-up-sequence";

// ============================================================================
// LEAD SCORING JOBS
// ============================================================================

export {
  scoreLeadTask,
  bulkScoreLeadsTask,
  scheduledLeadScoring,
} from "./lead-scoring";

// ============================================================================
// DOCUMENT INDEXING JOBS
// ============================================================================

export {
  indexDocumentTask,
  bulkIndexDocumentsTask,
  reindexAllDocumentsTask,
} from "./document-indexing";

// ============================================================================
// CAMPAIGN SENDING JOBS
// ============================================================================

export {
  sendCampaignTask,
  scheduleCampaignTask,
} from "./campaign-sender";

// ============================================================================
// WORKFLOW EXECUTION JOBS
// ============================================================================

export {
  executeAgentTask,
  processActiveAgentsTask,
  scheduledAgentHealthCheck,
} from "./workflow-executor";

// ============================================================================
// WEBSITE ANALYSIS JOBS
// ============================================================================

export {
  analyzeWebsiteTask,
} from "./website-analysis";

// ============================================================================
// SOCIAL MEDIA POSTING JOBS
// ============================================================================

export {
  processScheduledSocialPosts,
  scheduledSocialPosting,
} from "./social-posting";

// ============================================================================
// PRECOMPUTED INSIGHTS JOBS
// ============================================================================

export {
  precomputeWorkspaceInsightsTask,
  scheduledInsightsPrecompute,
} from "./precompute-insights";

// ============================================================================
// CONTENT SOURCE DISCOVERY JOBS
// ============================================================================

export {
  discoverWorkspaceSourcesTask,
  scheduledSourceDiscovery,
} from "./content-source-discovery";
