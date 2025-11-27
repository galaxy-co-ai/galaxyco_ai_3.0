# Background Jobs Documentation

This document describes the background jobs implemented using Trigger.dev v4.

## Overview

Background jobs are defined in `src/trigger/` and are automatically discovered by Trigger.dev. The configuration is in `trigger.config.ts` at the project root.

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

## Notes

- All jobs include retry logic (default: 3 attempts)
- Jobs respect multi-tenant isolation via workspaceId
- Long-running jobs are split into smaller tasks
- Error details are logged to Trigger.dev dashboard
