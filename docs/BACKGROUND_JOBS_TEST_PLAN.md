# Background Jobs Test Plan & Monitoring

**Date:** 2025-12-12  
**Platform:** Trigger.dev v4  
**Total Jobs:** 12

---

## 📋 Job Inventory

| # | Job File | Tasks | Status | Triggers |
|---|----------|-------|--------|----------|
| 1 | `campaign-sender.ts` | `send-campaign`, `schedule-campaign` | ✅ Documented | API, Manual |
| 2 | `content-source-discovery.ts` | TBD | ⚠️ Undocumented | TBD |
| 3 | `document-indexing.ts` | `index-document`, `bulk-index-documents`, `reindex-all-documents` | ✅ Documented | API, Cron |
| 4 | `hit-list-prioritization.ts` | TBD | ⚠️ Undocumented | TBD |
| 5 | `lead-scoring.ts` | `score-lead`, `bulk-score-leads`, `scheduled-lead-scoring` | ✅ Documented | API, Cron (2 AM) |
| 6 | `precompute-insights.ts` | TBD | ⚠️ Undocumented | TBD |
| 7 | `proactive-events.ts` | TBD | ⚠️ Undocumented | TBD |
| 8 | `social-posting.ts` | TBD | ⚠️ Undocumented | TBD |
| 9 | `team-executor.ts` | TBD | ⚠️ Undocumented | TBD |
| 10 | `website-analysis.ts` | TBD | ⚠️ Undocumented | TBD |
| 11 | `workflow-executor.ts` | `execute-agent`, `process-active-agents`, `scheduled-agent-health-check` | ✅ Documented | API, Cron (Hourly) |
| 12 | `workflow-executor-orchestration.ts` | TBD | ⚠️ Undocumented | TBD |

---

## 🧪 Testing Checklist

### Phase 1: Smoke Tests (30 min)

Test each job can be triggered successfully:

- [ ] **campaign-sender** - Trigger `send-campaign` with test campaign
- [ ] **content-source-discovery** - Check job definition exists
- [ ] **document-indexing** - Trigger `index-document` with test doc
- [ ] **hit-list-prioritization** - Check job definition exists
- [ ] **lead-scoring** - Trigger `score-lead` with test lead
- [ ] **precompute-insights** - Check job definition exists
- [ ] **proactive-events** - Check job definition exists
- [ ] **social-posting** - Check job definition exists
- [ ] **team-executor** - Check job definition exists
- [ ] **website-analysis** - Check job definition exists
- [ ] **workflow-executor** - Trigger `execute-agent` with test agent
- [ ] **workflow-executor-orchestration** - Check job definition exists

### Phase 2: Integration Tests (1 hour)

Test jobs with real data in dev environment:

#### Campaign Sender
```bash
# Prerequisites: Create test campaign in dashboard
# Expected: Campaign sent, stats updated
curl -X POST https://yourapp.com/api/campaigns/[id]/send
```

#### Lead Scoring
```bash
# Prerequisites: Create test lead
# Expected: Lead score calculated (0-100)
# Check: Lead record updated with score
```

#### Document Indexing
```bash
# Prerequisites: Upload test document
# Expected: Document chunked and indexed in Upstash Vector
# Check: Can search for document content
```

#### Workflow Executor
```bash
# Prerequisites: Create test agent
# Expected: Agent executes, logs saved
# Check: Execution history in dashboard
```

### Phase 3: Cron Job Verification (10 min)

Verify scheduled jobs are configured:

- [ ] **Lead Scoring Cron** - Daily at 2 AM
  ```typescript
  // Verify in Trigger.dev dashboard
  // Schedule: "0 2 * * *" (2 AM UTC daily)
  ```

- [ ] **Agent Health Check Cron** - Hourly
  ```typescript
  // Schedule: "0 * * * *" (Every hour)
  ```

### Phase 4: Error Handling (30 min)

Test job failures are handled gracefully:

- [ ] **Invalid Input** - Trigger job with missing required fields
  - Expected: Error logged, retry attempted
  
- [ ] **Database Error** - Simulate DB connection failure
  - Expected: Job retries, alerts sent

- [ ] **External API Failure** - Simulate OpenAI timeout
  - Expected: Job retries with backoff

---

## 🔍 Monitoring Setup

### 1. Trigger.dev Dashboard

**Access:** https://cloud.trigger.dev

**What to Monitor:**
- Job success rate (target: >95%)
- Average execution time
- Failed runs (investigate immediately)
- Retry attempts

**Alerts to Set:**
- Job failure rate > 10%
- Job execution time > 5 minutes
- More than 3 retries on single run

### 2. Sentry Integration

**Current Status:** ✅ Sentry configured in project

**Job Error Tracking:**
```typescript
// All jobs should log errors to Sentry
import { logger } from '@/lib/logger';

try {
  // ... job logic
} catch (error) {
  logger.error('Job failed', { 
    job: 'campaign-sender',
    error,
    payload 
  });
  throw error; // Let Trigger.dev retry
}
```

### 3. Database Monitoring

**Tables to Watch:**
- `agent_executions` - Agent run history
- `campaigns` - Campaign stats
- `knowledge_base_items` - Indexing status
- `prospects` - Lead scores

**Queries for Health Check:**
```sql
-- Failed jobs in last 24 hours
SELECT status, COUNT(*) 
FROM agent_executions 
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND status = 'failed'
GROUP BY status;

-- Average job duration
SELECT AVG(duration_ms) as avg_duration_ms
FROM agent_executions
WHERE completed_at IS NOT NULL;

-- Pending jobs (shouldn't be many)
SELECT COUNT(*) as pending_count
FROM agent_executions
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';
```

---

## 🚨 Troubleshooting Guide

### Job Not Triggering

**Symptoms:** Job doesn't appear in Trigger.dev dashboard

**Checklist:**
1. ✅ `TRIGGER_SECRET_KEY` set in environment
2. ✅ Job exported from `src/trigger/jobs.ts`
3. ✅ Trigger.dev dev server running (`npm run trigger:dev`)
4. ✅ Job deployed to Trigger.dev cloud

**Fix:**
```bash
# Re-deploy jobs
npx trigger.dev@latest deploy
```

### Job Fails Immediately

**Symptoms:** Job fails without retry

**Common Causes:**
- Missing environment variables (OpenAI API key, etc.)
- Invalid workspace ID
- Database connection timeout

**Debug Steps:**
1. Check Trigger.dev logs for error message
2. Verify all required env vars are set
3. Test database connection separately
4. Check Sentry for detailed error

### Job Stuck in "Running"

**Symptoms:** Job status never changes from "running"

**Common Causes:**
- Infinite loop in job code
- Timeout not configured
- External API hanging

**Fix:**
1. Cancel run in Trigger.dev dashboard
2. Add timeout to job configuration:
```typescript
export const myTask = task({
  id: "my-task",
  run: async (payload) => {
    // ... logic
  },
  timeout: 300, // 5 minutes max
});
```

---

## 📊 Success Metrics

### Week 1 Targets
- [ ] All 12 jobs tested in dev
- [ ] No failed jobs on manual trigger
- [ ] Cron jobs running on schedule
- [ ] Error logging working in Sentry

### Month 1 Targets
- [ ] >95% job success rate
- [ ] <5 minute average execution time
- [ ] Zero stuck jobs
- [ ] Monitoring dashboard created

---

## 🔧 Quick Reference Commands

### Start Trigger.dev Dev Server
```bash
npm run trigger:dev
```

### Deploy Jobs to Production
```bash
npx trigger.dev@latest deploy
```

### View Job Logs
```bash
# In Trigger.dev dashboard
# Or via API:
curl https://api.trigger.dev/api/v1/runs \
  -H "Authorization: Bearer $TRIGGER_SECRET_KEY"
```

### Test Job Manually
```typescript
// In your code or API route:
import { myTask } from '@/trigger/jobs';

await myTask.trigger({
  // ... payload
});
```

---

## ✅ Next Steps

1. **Complete Phase 1 Smoke Tests** (30 min)
   - Run each job once in dev
   - Verify no immediate errors

2. **Document Undocumented Jobs** (1 hour)
   - Add descriptions to jobs.md
   - Document inputs/outputs
   - Add usage examples

3. **Set Up Monitoring** (30 min)
   - Configure Trigger.dev alerts
   - Add Sentry breadcrumbs to jobs
   - Create health check dashboard

4. **Production Deploy** (15 min)
   - Deploy all jobs to Trigger.dev cloud
   - Verify cron schedules
   - Test one job in production

---

**Status:** 📝 Test plan ready  
**Next Action:** Run Phase 1 smoke tests in dev environment
