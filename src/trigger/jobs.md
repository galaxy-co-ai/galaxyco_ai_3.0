# Background Jobs Documentation

This document describes the background jobs implemented using Trigger.dev v4.

## Overview

Background jobs are defined in `src/trigger/` and are automatically discovered by Trigger.dev. The configuration is in `trigger.config.ts` at the project root.

## Key Features

- **Realtime Streams**: Live AI output streaming to the UI
- **Per-Tenant Queues**: Concurrency control per subscription tier
- **Batch APIs**: Efficient bulk operations with `batchTrigger` and `batchTriggerAndWait`
- **Wait Functions**: `wait.for()`, `wait.until()`, `wait.forToken()` for scheduling and approvals
- **Human-in-the-Loop**: Approval workflows with wait tokens
- **Idempotency Keys**: Prevent duplicate operations
- **Tags**: Observability and filtering in dashboard

## Setup

1. Get a Trigger.dev account at [trigger.dev](https://trigger.dev)
2. Create a project and get your API key
3. Add to `.env`:
   ```env
   TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxx
   ```
4. Run the dev server:
   ```bash
   npm run trigger:dev
   ```

## Implemented Jobs

### 1. Lead Scoring (`lead-scoring.ts`)

**Tasks:**
- `score-lead` - Scores a single lead based on multiple factors
- `bulk-score-leads` - Scores all unscored leads in a workspace
- `scheduled-lead-scoring` - Daily cron job (2 AM) to score all leads

**Scoring Factors:**
- Email presence (+15, +10 for corporate email)
- Phone presence (+10)
- Company name (+10)
- Job title (+10, +15 for C-level/VP)
- Estimated value (+10 to +20)
- Stage progression (0 to +50)
- Recent activity (+5 to +10)

**Usage:**
```typescript
import { scoreLeadTask, bulkScoreLeadsTask } from "@/trigger/jobs";

// Score a single lead
await scoreLeadTask.trigger({ 
  prospectId: "...", 
  workspaceId: "..." 
});

// Score all leads in workspace
await bulkScoreLeadsTask.trigger({ 
  workspaceId: "..." 
});
```

### 2. Document Indexing (`document-indexing.ts`)

**Tasks:**
- `index-document` - Indexes a single document in vector DB
- `bulk-index-documents` - Indexes all unindexed documents
- `reindex-all-documents` - Forces re-indexing of all documents

**Usage:**
```typescript
import { indexDocumentTask, bulkIndexDocumentsTask } from "@/trigger/jobs";

// Index a single document
await indexDocumentTask.trigger({ 
  itemId: "...", 
  workspaceId: "..." 
});

// Bulk index (force = re-index existing)
await bulkIndexDocumentsTask.trigger({ 
  workspaceId: "...", 
  force: false 
});
```

### 3. Campaign Sending (`campaign-sender.ts`)

**Tasks:**
- `send-campaign` - Sends an email campaign to its audience
- `schedule-campaign` - Schedules a campaign for future sending

**Features:**
- Target audience selection (all leads, new leads, qualified leads, contacts)
- Batch sending with rate limiting
- Campaign status tracking
- Automatic stats updating

**Usage:**
```typescript
import { sendCampaignTask, scheduleCampaignTask } from "@/trigger/jobs";

// Send immediately
await sendCampaignTask.trigger({ 
  campaignId: "...", 
  workspaceId: "..." 
});

// Schedule for later
await scheduleCampaignTask.trigger({ 
  campaignId: "...", 
  workspaceId: "...",
  scheduledFor: "2024-01-15T10:00:00Z"
});
```

### 4. Workflow Execution (`workflow-executor.ts`)

**Tasks:**
- `execute-agent` - Executes an AI agent with inputs
- `process-active-agents` - Lists/processes active agents
- `scheduled-agent-health-check` - Hourly health check cron

**Features:**
- Execution history tracking
- Input/output logging
- Agent stats updating
- Error handling with detailed logs

**Usage:**
```typescript
import { executeAgentTask } from "@/trigger/jobs";

await executeAgentTask.trigger({
  agentId: "...",
  workspaceId: "...",
  inputs: { someParam: "value" },
  triggeredBy: "user-id-or-system"
});
```

## Scheduled Jobs Summary

| Job | Schedule | Purpose |
|-----|----------|---------|
| `scheduled-lead-scoring` | Daily 2 AM | Score all leads across workspaces |
| `scheduled-agent-health-check` | Hourly | Monitor agent status and stats |

## Environment Variables

```env
# Required for Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_xxxxxxxxxxxx

# Optional: Trigger.dev API URL (default: https://api.trigger.dev)
TRIGGER_API_URL=https://api.trigger.dev
```

## Testing

Run the Trigger.dev dev server:
```bash
npm run trigger:dev
```

Jobs can be triggered:
1. Via Trigger.dev dashboard
2. Programmatically with `.trigger()` method
3. Via API endpoints (create your own)

## Realtime Streams (`streams.ts`)

Streams allow real-time output from tasks to the UI.

**Available Streams:**
- `agentOutputStream` - Live AI response chunks during agent execution
- `campaignProgressStream` - Campaign send progress updates
- `batchProgressStream` - Bulk operation progress tracking

**Usage:**
```typescript
// In a task:
import { agentOutputStream } from "@/trigger/jobs";

await agentOutputStream.write(runId, {
  type: "token",
  content: "AI response chunk...",
  timestamp: new Date().toISOString(),
});

// In React component:
import { useRealtimeStream } from "@trigger.dev/react-hooks";

const { data } = useRealtimeStream<AgentStreamChunk>(runId, { accessToken });
```

## Per-Tenant Queues (`queues.ts`)

Queues control concurrency based on subscription tier.

**Queue Configuration:**
| Tier | Queue Name | Concurrency |
|------|------------|-------------|
| Free | `free-tier-queue` | 1 |
| Starter | `standard-tier-queue` | 5 |
| Professional | `standard-tier-queue` | 5 |
| Enterprise | `enterprise-tier-queue` | 20 |
| System | `system-jobs-queue` | 10 |

**Usage:**
```typescript
import { getQueueForTier, buildWorkspaceQueueOptions } from "@/trigger/jobs";

// Get queue by tier
const queue = getQueueForTier("professional");

// Build trigger options
await task.trigger(payload, buildWorkspaceQueueOptions(workspaceId, "professional"));
```

## Human-in-the-Loop Approvals (`approvals.ts`)

Pause task execution until human approval.

**Usage:**
```typescript
import { requestApprovalTask, completeApproval } from "@/trigger/jobs";

// Request approval (pauses task)
const result = await requestApprovalTask.trigger({
  workspaceId: "...",
  type: "campaign",
  entityId: "campaign-123",
  title: "Review campaign before sending",
  description: "This will send to 5,000 recipients",
  requestedBy: "user-id",
  timeout: "24h",
});

// Complete approval via API:
POST /api/approvals/{id}/approve
POST /api/approvals/{id}/reject
```

## Follow-Up Sequences (`follow-up-sequence.ts`)

Multi-step sequences with configurable delays.

**Usage:**
```typescript
import { executeFollowUpSequenceTask, sendDelayedFollowUpTask } from "@/trigger/jobs";

// Multi-step sequence
await executeFollowUpSequenceTask.trigger({
  workspaceId: "...",
  prospectId: "...",
  sequenceId: "seq-123",
  sequenceName: "Welcome Series",
  triggeredBy: "user-id",
  steps: [
    { stepNumber: 1, delay: "0d", type: "email", subject: "Welcome!", body: "..." },
    { stepNumber: 2, delay: "3d", type: "email", subject: "Getting started", body: "..." },
    { stepNumber: 3, delay: "7d", type: "email", subject: "Tips & tricks", body: "..." },
  ],
});

// Single delayed follow-up
await sendDelayedFollowUpTask.trigger({
  workspaceId: "...",
  prospectId: "...",
  delay: "2d",
  subject: "Following up",
  body: "Hi {{name}}, just checking in...",
  triggeredBy: "user-id",
});
```

## Wait Functions

**wait.until()** - Wait until a specific date/time:
```typescript
await wait.until({ date: new Date("2024-01-15T10:00:00Z") });
```

**wait.for()** - Wait for a duration:
```typescript
await wait.for({ seconds: 3600 }); // 1 hour
await wait.for({ days: 1 });
```

**wait.forToken()** - Wait for external signal (approvals):
```typescript
const token = await wait.createToken({ timeout: "24h" });
const result = await wait.forToken<ApprovalResult>(token);
```

## Idempotency Keys

Prevent duplicate task execution:
```typescript
await task.trigger(payload, {
  idempotencyKey: `campaign-${campaignId}-send`,
  idempotencyKeyTTL: "24h",
});
```

## Tags for Observability

All tasks include tags for filtering in the dashboard:
```typescript
await task.trigger(payload, {
  tags: [
    `workspace:${workspaceId}`,
    `type:campaign-send`,
    `campaign:${campaignId}`,
  ],
});
```

**Common Tag Patterns:**
- `workspace:{id}` - Filter by tenant
- `type:{task-type}` - Filter by job type
- `entity:{id}` - Filter by related entity
- `tier:{subscription-tier}` - Filter by customer tier

## Batch Operations

**batchTrigger** - Fire-and-forget multiple tasks:
```typescript
const handles = await task.batchTrigger([
  { payload: { id: "1" } },
  { payload: { id: "2" } },
]);
```

**batchTriggerAndWait** - Wait for all tasks to complete:
```typescript
const results = await task.batchTriggerAndWait([
  { payload: { id: "1" } },
  { payload: { id: "2" } },
]);
```

## Notes

- All jobs include retry logic (default: 3 attempts)
- Jobs respect multi-tenant isolation via workspaceId
- Long-running jobs are split into smaller tasks
- Error details are logged to Trigger.dev dashboard
- Use tags for filtering runs in the dashboard
- Idempotency keys prevent duplicate operations
- Streams enable real-time UI updates
