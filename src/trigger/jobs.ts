/**
 * Trigger.dev Background Jobs
 * 
 * This file exports all background jobs for the application.
 * Jobs are automatically discovered by Trigger.dev from this directory.
 */

// Lead Scoring Jobs
export {
  scoreLeadTask,
  bulkScoreLeadsTask,
  scheduledLeadScoring,
} from "./lead-scoring";

// Document Indexing Jobs
export {
  indexDocumentTask,
  bulkIndexDocumentsTask,
  reindexAllDocumentsTask,
} from "./document-indexing";

// Campaign Sending Jobs
export {
  sendCampaignTask,
  scheduleCampaignTask,
} from "./campaign-sender";

// Workflow Execution Jobs
export {
  executeAgentTask,
  processActiveAgentsTask,
  scheduledAgentHealthCheck,
} from "./workflow-executor";
