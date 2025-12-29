# Sentry Alerts Configuration

**Last Updated:** 2024-12-11  
**Version:** Phase 4A Complete  
**Status:** Configuration Required

---

## Overview

This guide provides step-by-step instructions for configuring 4 critical Sentry alerts to monitor Neptune performance and health.

## Prerequisites

- Admin access to Sentry project
- Neptune metrics implementation deployed (Phase 4A Days 1-3)
- Sentry SDK configured in project

---

## Alert 1: Slow Response Times

**Purpose:** Detect when Neptune response times exceed performance target

**Configuration:**

1. **Navigate to Alerts**
   - Go to Sentry.io
   - Select your GalaxyCo project
   - Click "Alerts" in left sidebar
   - Click "Create Alert"

2. **Alert Type**
   - Select: "Issues"
   - Choose: "Custom metric"

3. **Alert Conditions**
   ```
   When: An event is captured
   If: event.tags[component] equals neptune
   And: event.tags[metric_type] equals response_time
   And: event.extra.duration is greater than 2000
   In: last 5 minutes
   Trigger alert when: at least 3 events match
   ```

4. **Alert Details**
   - **Name:** `Neptune - Slow Response Times`
   - **Environment:** All environments (or specify: production)
   - **Team:** Engineering

5. **Actions**
   - **Notification channels:**
     - Email to admin
     - Slack webhook (optional)
   - **Frequency:** Alert every 30 minutes until resolved

6. **Additional Context**
   - **Description:**
     ```
     Neptune AI requests are taking >2s to respond.
     This exceeds our Phase 1-3 optimization target.
     
     Check:
     - Cache hit rate
     - Database query times
     - RAG result counts
     
     View metrics: https://galaxyco.ai/api/admin/metrics/neptune
     ```

---

## Alert 2: Low Cache Hit Rate

**Purpose:** Detect when cache performance degrades below target

**Configuration:**

1. **Navigate to Alerts**
   - Same as Alert 1

2. **Alert Type**
   - Select: "Metric Alerts"
   - Choose: "Custom metric"

3. **Alert Query**
   ```
   Formula:
   (redis.get('metrics:cache:hits') / 
    (redis.get('metrics:cache:hits') + redis.get('metrics:cache:misses')))
   ```

   **Note:** Since Sentry doesn't directly access Redis, use this approach:
   - Track cache hit rate as custom metric in Sentry events
   - Or use health check endpoint polling (see workaround below)

4. **Workaround (Recommended):**
   
   Create scheduled health check that sends Sentry event with cache rate:
   
   ```typescript
   // In cron job or scheduled function
   import * as Sentry from '@sentry/nextjs';
   import { redis } from '@/lib/upstash';
   
   async function checkCacheRate() {
     const hits = await redis.get<number>('metrics:cache:hits') || 0;
     const misses = await redis.get<number>('metrics:cache:misses') || 0;
     const hitRate = hits / (hits + misses);
     
     if (hitRate < 0.5) {
       Sentry.captureEvent({
         message: 'Low Cache Hit Rate',
         level: 'warning',
         tags: {
           component: 'neptune',
           metric_type: 'cache_health'
         },
         extra: {
           hitRate,
           totalHits: hits,
           totalMisses: misses,
           threshold: 0.5
         }
       });
     }
   }
   ```

5. **Alert Conditions**
   ```
   When: An event is captured
   If: event.tags[component] equals neptune
   And: event.tags[metric_type] equals cache_health
   And: event.extra.hitRate is less than 0.5
   In: last 15 minutes
   Trigger alert when: at least 2 events match
   ```

6. **Alert Details**
   - **Name:** `Neptune - Low Cache Hit Rate`
   - **Environment:** Production
   - **Team:** Engineering

7. **Actions**
   - Email to admin
   - **Frequency:** Alert every 1 hour until resolved

8. **Additional Context**
   - **Description:**
     ```
     Neptune cache hit rate is below 50% (target: >70%).
     This causes slower response times and higher costs.
     
     Check:
     - Redis connection status
     - Cache TTL settings
     - Cache invalidation patterns
     
     View health: https://galaxyco.ai/api/admin/metrics/health
     ```

---

## Alert 3: High Error Rate

**Purpose:** Detect spikes in Neptune errors

**Configuration:**

1. **Navigate to Alerts**
   - Same as Alert 1

2. **Alert Type**
   - Select: "Issues"
   - Choose: "Error frequency"

3. **Alert Conditions**
   ```
   When: An event is captured
   If: event.tags[component] equals neptune
   And: event.level equals error OR event.level equals fatal
   In: last 10 minutes
   Trigger alert when: at least 5 events match
   ```

4. **Alert Details**
   - **Name:** `Neptune - High Error Rate`
   - **Environment:** All environments
   - **Team:** Engineering

5. **Actions**
   - Email to admin
   - Slack webhook (high priority)
   - **Frequency:** Alert immediately, then every 15 minutes

6. **Additional Context**
   - **Description:**
     ```
     Neptune is experiencing elevated error rates.
     This impacts user experience and conversation quality.
     
     Check:
     - Error details in Sentry issues
     - System health status
     - Database connection
     - API rate limits
     
     View errors: Sentry > Issues > component:neptune level:error
     ```

---

## Alert 4: Token Usage Spike

**Purpose:** Detect unusual increases in token consumption

**Configuration:**

1. **Navigate to Alerts**
   - Same as Alert 1

2. **Alert Type**
   - Select: "Issues"
   - Choose: "Custom metric"

3. **Alert Conditions**
   ```
   When: An event is captured
   If: event.tags[component] equals neptune
   And: event.tags[metric_type] equals response_time
   And: event.extra.tokensUsed is greater than 2000
   In: last 15 minutes
   Trigger alert when: at least 5 events match
   ```

4. **Alert Details**
   - **Name:** `Neptune - Token Usage Spike`
   - **Environment:** Production
   - **Team:** Engineering

5. **Actions**
   - Email to admin
   - **Frequency:** Alert every 1 hour until resolved

6. **Additional Context**
   - **Description:**
     ```
     Neptune token usage is significantly higher than expected.
     Average should be ~600 tokens/request, seeing >2000.
     
     Check:
     - Context pruning active
     - Conversation history length
     - RAG result sizes
     - Prompt template changes
     
     View metrics: https://galaxyco.ai/api/admin/metrics/neptune
     ```

---

## Verification

After creating alerts, verify they're working:

1. **Trigger Test Event**
   ```typescript
   // In API route or test script
   import * as Sentry from '@sentry/nextjs';
   
   // Test slow response alert
   Sentry.captureEvent({
     message: 'Test - Slow Response',
     level: 'warning',
     tags: {
       component: 'neptune',
       metric_type: 'response_time'
     },
     extra: {
       duration: 3000,
       test: true
     }
   });
   ```

2. **Check Alert Dashboard**
   - Go to Sentry > Alerts
   - Look for recent triggers
   - Verify notifications received

3. **Test Resolution**
   - Mark test issue as resolved
   - Verify alert stops firing

---

## Alert Thresholds Summary

| Alert | Metric | Threshold | Window | Frequency |
|-------|--------|-----------|--------|-----------|
| Slow Response | Response time | >2000ms | 5 min | 30 min |
| Low Cache Rate | Hit rate | <50% | 15 min | 1 hour |
| High Errors | Error count | ≥5 errors | 10 min | 15 min |
| Token Spike | Tokens/request | >2000 | 15 min | 1 hour |

**Rationale:**
- Slow response: Immediate performance impact, moderate alert frequency
- Low cache: Leading indicator, less urgent but requires attention
- High errors: Critical user impact, immediate and frequent alerts
- Token spike: Cost concern, moderate alert frequency

---

## Maintenance

**Weekly:**
- Review alert history for false positives
- Adjust thresholds based on actual usage patterns
- Check that notifications are reaching correct channels

**Monthly:**
- Analyze alert trends
- Update thresholds if targets change
- Add new alerts as needed

**After Incidents:**
- Review alert effectiveness
- Tune thresholds if alert missed issue
- Document learnings

---

## Future Enhancements (Phase 4B)

When Mission Control visual dashboard is built:

1. **Alert History Panel**
   - Display recent alerts
   - Show resolution times
   - Alert frequency charts

2. **Alert Configuration UI**
   - Adjust thresholds from dashboard
   - Enable/disable alerts
   - Test alerts

3. **Notification Preferences**
   - Per-user notification settings
   - Channel preferences (email/Slack/SMS)
   - Quiet hours configuration

---

## Troubleshooting Alerts

### Alert Not Firing

**Check:**
1. Alert is enabled in Sentry
2. Event tags match exactly (case-sensitive)
3. Threshold values are correct
4. Time window is appropriate
5. Notification channels configured

**Test:**
```typescript
// Send test event matching alert conditions
Sentry.captureEvent({
  message: 'Manual Test',
  tags: { /* exact tags from alert */ },
  extra: { /* values exceeding thresholds */ }
});
```

---

### Too Many False Positives

**Actions:**
1. Increase threshold (e.g., 2000ms → 2500ms)
2. Extend time window (e.g., 5 min → 10 min)
3. Require more events (e.g., 3 events → 5 events)
4. Add environment filter (production only)

---

### Missing Critical Issues

**Actions:**
1. Decrease threshold (make more sensitive)
2. Shorten time window (faster detection)
3. Lower event count requirement
4. Add additional alert for edge cases

---

## Reference

**Related Documentation:**
- `docs/observability/METRICS.md` - Full metrics guide
- `docs/plans/NEPTUNE_OPTIMIZATION_PLAN_V2.md` - Optimization plan

**External Resources:**
- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Sentry Metric Alerts](https://docs.sentry.io/product/alerts/alert-types/#metric-alerts)
- [Sentry Issue Alerts](https://docs.sentry.io/product/alerts/alert-types/#issue-alerts)

---

## Implementation Checklist

- [ ] Create Alert 1: Slow Response Times
- [ ] Create Alert 2: Low Cache Hit Rate (with cron workaround)
- [ ] Create Alert 3: High Error Rate
- [ ] Create Alert 4: Token Usage Spike
- [ ] Test each alert with manual event
- [ ] Verify notifications received
- [ ] Document notification channels used
- [ ] Schedule weekly alert review

**Estimated time:** 30-45 minutes for all 4 alerts
